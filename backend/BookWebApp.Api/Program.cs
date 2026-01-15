using System.Text;
using System.Security.Claims;
using BookWebApp.Api.Data;
using BookWebApp.Api.Models;
using BookWebApp.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization;

var builder = WebApplication.CreateBuilder(args);

// ----------------- CONFIGURATION -----------------
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
var connectionString = !string.IsNullOrEmpty(databaseUrl)
    ? BuildPostgresConnectionString(databaseUrl)
    : builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=books.db";

// ----------------- SERVICES -----------------
builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (connectionString.Contains("Host="))
        options.UseNpgsql(connectionString);
    else
        options.UseSqlite(connectionString);
});

builder.Services.AddScoped<AuthService>();

// ----------------- CORS -----------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("https://bookquotes-frontend.vercel.app", "http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ----------------- CONTROLLERS -----------------
builder.Services.AddControllers();

// ----------------- JWT AUTH -----------------
var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY")
             ?? builder.Configuration["Jwt:Key"]
             ?? throw new InvalidOperationException("JWT_KEY is required");

Console.WriteLine($"JWT Key configured: {!string.IsNullOrEmpty(jwtKey)}");

var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes),

            // Match appsettings.json
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "BookWebApp",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "BookWebAppUsers",

            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(5),

            // Match your token claims exactly
            NameClaimType = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
            RoleClaimType = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        };

        // Debug events
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"Authentication failed: {context.Exception.Message}");
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// ----------------- BUILD APP -----------------
var app = builder.Build();

// ----------------- MIDDLEWARE ORDER -----------------
app.UseRouting();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

// Debug logging (remove in production)
if (app.Environment.IsDevelopment())
{
    app.Use(async (context, next) =>
    {
        Console.WriteLine($"{context.Request.Method} {context.Request.Path}");
        await next();
        Console.WriteLine($"Response: {context.Response.StatusCode}");
    });
}

// ----------------- DATABASE INIT & SEED -----------------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var authService = scope.ServiceProvider.GetRequiredService<AuthService>();

    try
    {
        await db.Database.EnsureCreatedAsync();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database error: {ex.Message}");
    }

    // Seed data...
    var yvonne = await db.Users.FirstOrDefaultAsync(u => u.Username == "Yvonne");
    if (yvonne == null)
    {
        var success = await authService.CreateAdminUser("Yvonne", "Monday123!");
        if (!success)
        {
            using var hmac = new System.Security.Cryptography.HMACSHA512();
            yvonne = new User
            {
                Username = "Yvonne",
                PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes("Monday123!")),
                PasswordSalt = hmac.Key,
                Role = UserRole.Admin
            };
            db.Users.Add(yvonne);
            await db.SaveChangesAsync();
        }
    }

    if (!await db.Quotes.AnyAsync() && yvonne != null)
    {
        db.Quotes.AddRange(
            new Quote { Text = "Tomorrow's results are determined by current accumulation of success.", Author = "Yvonne", UserId = yvonne.Id, IsGlobal = true },
            new Quote { Text = "The only thing that you absolutely have to know is the location of the library.", Author = "Albert Einstein", UserId = yvonne.Id, IsGlobal = true },
            new Quote { Text = "A reader lives a thousand lives before he dies…", Author = "George R.R. Martin", UserId = yvonne.Id, IsGlobal = true },
            new Quote { Text = "Life is ours to be spent, not to be saved.", Author = "D.H. Lawrence", UserId = yvonne.Id, IsGlobal = true },
            new Quote { Text = "The secret of getting ahead is getting started.", Author = "Mark Twain", UserId = yvonne.Id, IsGlobal = true }
        );
        await db.SaveChangesAsync();
    }

    if (!await db.Books.AnyAsync())
    {
        var books = new List<Book>
        {
            new Book { Title = "1984", Author = "George Orwell", PublishDate = DateTime.SpecifyKind(DateTime.Parse("1949-06-08"), DateTimeKind.Utc) },
            new Book { Title = "Pride and Prejudice", Author = "Jane Austen", PublishDate = DateTime.SpecifyKind(DateTime.Parse("1813-01-28"), DateTimeKind.Utc) }
        };
        db.Books.AddRange(books);
        await db.SaveChangesAsync();
    }
}

// ----------------- ROUTES -----------------
app.MapGet("/", () => "BookQuotes API").AllowAnonymous();

app.MapGet("/health", async (AppDbContext db) =>
{
    try
    {
        return Results.Ok(new
        {
            status = await db.Database.CanConnectAsync() ? "healthy" : "unhealthy",
            provider = db.Database.ProviderName,
            time = DateTime.UtcNow
        });
    }
    catch (Exception ex)
    {
        return Results.Ok(new { status = "error", error = ex.Message, time = DateTime.UtcNow });
    }
}).AllowAnonymous();

app.MapControllers();

app.MapFallback(() => Results.NotFound("API endpoint not found"));

app.Run();

// ----------------- POSTGRES PARSER -----------------
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