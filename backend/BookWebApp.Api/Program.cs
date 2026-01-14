using System.Text;
using System.Text.Json.Serialization;
using BookWebApp.Api.Data;
using BookWebApp.Api.Services;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;

Env.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddEnvironmentVariables();
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// ----------------- DATABASE CONNECTION -----------------
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL") 
                  ?? Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");

string connectionString;
if (builder.Environment.IsProduction())
{
    if (string.IsNullOrWhiteSpace(databaseUrl))
        throw new Exception("DATABASE_URL is required in production");

    connectionString = BuildPostgresConnectionString(databaseUrl);
}
else
{
    connectionString = !string.IsNullOrWhiteSpace(databaseUrl)
        ? BuildPostgresConnectionString(databaseUrl)
        : builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=books.db";
}

// ----------------- EF CORE -----------------
builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (connectionString.Contains("Host="))
    {
        options.UseNpgsql(connectionString, npgsql =>
        {
            npgsql.EnableRetryOnFailure(5, TimeSpan.FromSeconds(30), null);
            npgsql.CommandTimeout(60); 
            npgsql.MigrationsAssembly(typeof(Program).Assembly.FullName);
        });
    }
    else
    {
        options.UseSqlite(connectionString);
    }

    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }
});

// ----------------- SERVICES -----------------
builder.Services.AddScoped<AuthService>();

// ----------------- CORS -----------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "https://book-quotes-web-app-frontend.onrender.com",
                "http://localhost:4200"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ----------------- CONTROLLERS -----------------
builder.Services.AddControllers()
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        opt.JsonSerializerOptions.WriteIndented = true;
    });

// ----------------- SWAGGER -----------------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ----------------- JWT AUTH -----------------
var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY") 
             ?? builder.Configuration["Jwt:Key"] 
             ?? throw new Exception("JWT_KEY is missing");

var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER") 
             ?? builder.Configuration["Jwt:Issuer"] 
             ?? "BookWebApp";

var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") 
               ?? builder.Configuration["Jwt:Audience"] 
               ?? "BookWebAppUsers";

var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
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

// ----------------- TEMPORARY DATABASE RESET -----------------
// ⚠️ Use only in development to fix CRUD issues. Remove after testing!
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    Console.WriteLine("Deleting existing database...");
    db.Database.EnsureDeleted(); // Deletes all tables
    Console.WriteLine("Applying migrations...");
    db.Database.Migrate();       // Recreates tables from migrations
    Console.WriteLine("Database ready");
}

// ----------------- MIDDLEWARE -----------------
app.UseRouting();
app.UseCors("AllowFrontend");  // Must be BEFORE auth
app.UseAuthentication();
app.UseAuthorization();

// ----------------- SWAGGER -----------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ----------------- HEALTH CHECK -----------------
app.MapGet("/health", async (AppDbContext db) =>
{
    var canConnect = await db.Database.CanConnectAsync();
    return Results.Ok(new
    {
        status = canConnect ? "healthy" : "unhealthy",
        provider = db.Database.ProviderName,
        time = DateTime.UtcNow
    });
}).AllowAnonymous();

// ----------------- CONTROLLERS -----------------
app.MapControllers();

// ----------------- SPA FALLBACK -----------------
app.MapFallback(() => Results.NotFound("API endpoint not found"));

// ----------------- STARTUP LOG -----------------
Console.WriteLine("========================================");
Console.WriteLine("BookWebApp API started");
Console.WriteLine($"Environment: {app.Environment.EnvironmentName}");
Console.WriteLine($"Database: {(connectionString.Contains("Host=") ? "PostgreSQL" : "SQLite")}");
Console.WriteLine("CORS Origins: https://book-quotes-web-app-frontend.onrender.com, http://localhost:4200");
Console.WriteLine("✅ All frontend requests are allowed (books, quotes, etc.)");
Console.WriteLine("========================================");

app.Run();

// ----------------- POSTGRES CONNECTION PARSER -----------------
static string BuildPostgresConnectionString(string databaseUrl)
{
    var uri = new Uri(databaseUrl);
    var userInfo = uri.UserInfo.Split(':');
    return new NpgsqlConnectionStringBuilder
    {
        Host = uri.Host,
        Port = uri.Port > 0 ? uri.Port : 5432,
        Database = uri.AbsolutePath.TrimStart('/'),
        Username = userInfo[0],
        Password = userInfo.Length > 1 ? userInfo[1] : "",
        SslMode = SslMode.Require,
        Pooling = true,
        MinPoolSize = 1,
        MaxPoolSize = 10,
        KeepAlive = 30,
        Timeout = 60,
        CommandTimeout = 60
    }.ToString();
}
