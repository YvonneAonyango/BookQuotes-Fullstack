using System.Text;
using System.Text.Json.Serialization;
using BookWebApp.Api.Data;
using BookWebApp.Api.Services;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;

// Load .env for local development
Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Add environment variables + logging
builder.Configuration.AddEnvironmentVariables();
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// Read Render / custom database URL
var databaseUrl =
    Environment.GetEnvironmentVariable("DATABASE_URL") ??
    Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");

string connectionString;

// Production must use PostgreSQL
if (builder.Environment.IsProduction())
{
    if (string.IsNullOrWhiteSpace(databaseUrl))
        throw new Exception("DATABASE_URL is required in production");

    Console.WriteLine("Production environment detected");
    Console.WriteLine("Using PostgreSQL");

    connectionString = BuildPostgresConnectionString(databaseUrl);
}
else
{
    // Development: PostgreSQL if provided, otherwise SQLite
    if (!string.IsNullOrWhiteSpace(databaseUrl))
    {
        Console.WriteLine("Development using PostgreSQL");
        connectionString = BuildPostgresConnectionString(databaseUrl);
    }
    else
    {
        Console.WriteLine("Development using SQLite");
        connectionString =
            builder.Configuration.GetConnectionString("DefaultConnection")
            ?? "Data Source=books.db";
    }
}

// Configure EF Core
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

// App services
builder.Services.AddScoped<AuthService>();

builder.Services.AddControllers()
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        opt.JsonSerializerOptions.WriteIndented = true;
    });

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// JWT configuration
var jwtKey =
    Environment.GetEnvironmentVariable("JWT_KEY")
    ?? builder.Configuration["Jwt:Key"]
    ?? throw new Exception("JWT_KEY is missing");

var issuer =
    Environment.GetEnvironmentVariable("JWT_ISSUER")
    ?? builder.Configuration["Jwt:Issuer"]
    ?? "BookWebApp";

var audience =
    Environment.GetEnvironmentVariable("JWT_AUDIENCE")
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

// CORS
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

// Render port
builder.WebHost.ConfigureKestrel(opt =>
{
    var port = Environment.GetEnvironmentVariable("PORT");
    opt.ListenAnyIP(!string.IsNullOrEmpty(port) ? int.Parse(port) : 5000);
});

var app = builder.Build();

// Apply migrations only (NO EnsureCreated)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    Console.WriteLine("Applying database migrations...");
    db.Database.Migrate();
    Console.WriteLine("Database ready");
}

// Middleware order
app.UseRouting();

// ⚡ Enable CORS BEFORE auth
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

// Swagger in development only
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Health check
app.MapGet("/health", async (AppDbContext db) =>
{
    var canConnect = await db.Database.CanConnectAsync();
    return Results.Ok(new
    {
        status = canConnect ? "healthy" : "unhealthy",
        provider = db.Database.ProviderName,
        time = DateTime.UtcNow
    });
});

// Map controllers
app.MapControllers();

// Startup log
Console.WriteLine("========================================");
Console.WriteLine("BookWebApp API started");
Console.WriteLine($"Environment: {app.Environment.EnvironmentName}");
Console.WriteLine($"Database: {(connectionString.Contains("Host=") ? "PostgreSQL" : "SQLite")}");
Console.WriteLine("========================================");

app.Run();

// PostgreSQL URL parser (Render compatible)
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
        TrustServerCertificate = true,
        Pooling = true,
        MinPoolSize = 1,
        MaxPoolSize = 10,
        KeepAlive = 30,
        Timeout = 60,
        CommandTimeout = 60
    }.ToString();
}
