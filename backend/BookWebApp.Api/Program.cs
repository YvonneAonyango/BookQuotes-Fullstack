using System.Text;
using BookWebApp.Api.Data;
using BookWebApp.Api.Models;
using BookWebApp.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ----------------- DATABASE -----------------
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
var connectionString = !string.IsNullOrEmpty(databaseUrl)
    ? BuildPostgresConnectionString(databaseUrl)
    : builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=books.db";

builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (connectionString.Contains("Host="))
        options.UseNpgsql(connectionString);
    else
        options.UseSqlite(connectionString);
});

// ----------------- SERVICES -----------------
builder.Services.AddScoped<AuthService>();

// ----------------- CORS -----------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "https://bookquotes-frontend-8houur7c4-yvonneys-projects-536efb35.vercel.app", // Vercel frontend
                "http://localhost:4200" // Local Angular dev
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ----------------- CONTROLLERS -----------------
builder.Services.AddControllers();

// ----------------- SWAGGER (Dev only) -----------------
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
}

// ----------------- JWT -----------------
var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY") 
             ?? builder.Configuration["Jwt:Key"] 
             ?? throw new InvalidOperationException("JWT_KEY is required");

var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "BookWebApp";
var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "BookWebAppUsers";
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

builder.Services.AddAuthentication()
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = signingKey,
            ClockSkew = TimeSpan.Zero,
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
        };
    });

var app = builder.Build();

// ----------------- MIDDLEWARE -----------------
app.UseRouting();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

// ----------------- SWAGGER UI -----------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ----------------- DATABASE INITIALIZATION & SEEDING -----------------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var authService = scope.ServiceProvider.GetRequiredService<AuthService>();

    try
    {
        await db.Database.MigrateAsync();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database migration error: {ex.Message}");
    }

    // Ensure admin user exists
    var yvonne = await db.Users.FirstOrDefaultAsync(u => u.Username == "Yvonne");
    if (yvonne == null)
    {
        var success = await authService.CreateAdminUser("Yvonne", "Monday123!");
        if (success)
        {
            yvonne = await db.Users.FirstOrDefaultAsync(u => u.Username == "Yvonne");
        }
    }

    // Seed quotes if none exist
    if (!await db.Quotes.AnyAsync() && yvonne != null)
    {
        var quotes = new List<Quote>
        {
            new Quote { Text = "Tomorrow's results are determined by current accumulation of success.", Author = "Yvonne", UserId = yvonne.Id, IsGlobal = true },
            new Quote { Text = "The only thing that you absolutely have to know is the location of the library.", Author = "Albert Einstein", UserId = yvonne.Id, IsGlobal = true },
            new Quote { Text = "A reader lives a thousand lives before he dies… The man who never reads lives only one.", Author = "George R.R. Martin", UserId = yvonne.Id, IsGlobal = true },
            new Quote { Text = "Life is ours to be spent, not to be saved.", Author = "D.H. Lawrence", UserId = yvonne.Id, IsGlobal = true },
            new Quote { Text = "The secret of getting ahead is getting started.", Author = "Mark Twain", UserId = yvonne.Id, IsGlobal = true }
        };
        db.Quotes.AddRange(quotes);
        await db.SaveChangesAsync();
    }
}

// ----------------- HEALTH CHECK -----------------
app.MapGet("/", () => "BookQuotes API").AllowAnonymous();
app.MapGet("/health", async (AppDbContext db) =>
{
    try
    {
        var canConnect = await db.Database.CanConnectAsync();
        return Results.Ok(new
        {
            status = canConnect ? "healthy" : "unhealthy",
            provider = db.Database.ProviderName,
            time = DateTime.UtcNow
        });
    }
    catch (Exception ex)
    {
        return Results.Ok(new { status = "error", error = ex.Message, time = DateTime.UtcNow });
    }
}).AllowAnonymous();

// ----------------- CONTROLLERS & FALLBACK -----------------
app.MapControllers();
app.MapFallback(() => Results.NotFound("API endpoint not found"));

app.Run();

// ----------------- POSTGRES CONNECTION PARSER -----------------
static string BuildPostgresConnectionString(string databaseUrl)
{
    var uri = new Uri(databaseUrl);
    var userInfo = uri.UserInfo.Split(':');
    return new Npgsql.NpgsqlConnectionStringBuilder
    {
        Host = uri.Host,
        Port = uri.Port > 0 ? uri.Port : 5432,
        Database = uri.AbsolutePath.TrimStart('/'),
        Username = userInfo[0],
        Password = userInfo.Length > 1 ? userInfo[1] : "",
        SslMode = Npgsql.SslMode.Require,
        Pooling = true,
        MaxPoolSize = 10,
        Timeout = 30
    }.ToString();
}
