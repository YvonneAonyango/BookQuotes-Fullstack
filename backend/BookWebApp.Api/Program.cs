using System.Text;
using System.Text.Json.Serialization;
using BookWebApp.Api.Data;
using BookWebApp.Api.Models;
using BookWebApp.Api.Services;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;

Env.Load();

var builder = WebApplication.CreateBuilder(args);

// ----------------- CONFIGURATION -----------------
builder.Configuration.AddEnvironmentVariables();

// ----------------- LOGGING -----------------
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

Console.WriteLine($"Using database: {(connectionString.Contains("Host=") ? "PostgreSQL" : "SQLite")}");

// ----------------- EF CORE -----------------
builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (connectionString.Contains("Host="))
    {
        options.UseNpgsql(connectionString, npgsql =>
        {
            npgsql.EnableRetryOnFailure(5, TimeSpan.FromSeconds(30), null);
            npgsql.CommandTimeout(60);
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

// ----------------- DATABASE INITIALIZATION -----------------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    
    Console.WriteLine("Creating database from DbContext...");
    
    try
    {
        var created = await db.Database.EnsureCreatedAsync();
        
        if (created)
        {
            Console.WriteLine("Database created successfully");
            Console.WriteLine("Tables: Books, Users, Quotes");

            // ----------------- SEED 5 GLOBAL QUOTES -----------------
            Console.WriteLine("Seeding 5 global quotes...");
            var quotes = new List<Quote>
            {
                new Quote
                {
                    Text = "Tomorrow's results are determined by current accumulation of success.",
                    Author = "Yvonne",
                    IsGlobal = true
                },
                new Quote
                {
                    Text = "The only thing that you absolutely have to know, is the location of the library.",
                    Author = "Albert Einstein",
                    IsGlobal = true
                },
                new Quote
                {
                    Text = "A reader lives a thousand lives before he dies… The man who never reads lives only one.",
                    Author = "George R.R. Martin",
                    IsGlobal = true
                },
                new Quote
                {
                    Text = "Life is ours to be spent, not to be saved.",
                    Author = "D.H. Lawrence",
                    IsGlobal = true
                },
                new Quote
                {
                    Text = "The secret of getting ahead is getting started.",
                    Author = "Mark Twain",
                    IsGlobal = true
                }
            };

            db.Quotes.AddRange(quotes); // <-- AddRange for a list
            await db.SaveChangesAsync();
            Console.WriteLine("Seeded 5 global quotes successfully");
        }
        else
        {
            Console.WriteLine("Database already exists");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error creating database: {ex.Message}");
    }
}

// ----------------- MIDDLEWARE -----------------
app.UseRouting();
app.UseCors("AllowFrontend");
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
        return Results.Ok(new
        {
            status = "unhealthy",
            error = ex.Message,
            time = DateTime.UtcNow
        });
    }
}).AllowAnonymous();

// ----------------- CONTROLLERS -----------------
app.MapControllers();

// ----------------- FALLBACK -----------------
app.MapFallback(() => Results.NotFound("API endpoint not found"));

// ----------------- STARTUP LOG -----------------
Console.WriteLine("\nBookWebApp API started");
Console.WriteLine($"Environment: {app.Environment.EnvironmentName}");
Console.WriteLine($"Database: {(connectionString.Contains("Host=") ? "PostgreSQL" : "SQLite")}");
Console.WriteLine("CORS Origins: https://book-quotes-web-app-frontend.onrender.com, http://localhost:4200");
Console.WriteLine("All frontend requests are allowed");

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
