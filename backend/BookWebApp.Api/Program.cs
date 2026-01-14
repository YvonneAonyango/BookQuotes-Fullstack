using System.Text;
using BookWebApp.Api.Data;
using BookWebApp.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text.Json.Serialization;
using DotNetEnv;
using Npgsql;

Env.Load(); // Load .env if exists

var builder = WebApplication.CreateBuilder(args);

// CONFIGURATION
builder.Configuration.AddEnvironmentVariables();

// Add logging for debugging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// DATABASE
var connString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")
                 ?? builder.Configuration.GetConnectionString("DefaultConnection")
                 ?? "Data Source=books.db";

Console.WriteLine($"Database connection string found: {!string.IsNullOrEmpty(connString)}");

// PostgreSQL URI -> connection string
if (connString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
{
    Console.WriteLine("Detected PostgreSQL connection string format");
    
    try
    {
        var uri = new Uri(connString);
        var userInfo = uri.UserInfo.Split(':');
        var username = userInfo[0];
        var password = userInfo.Length > 1 ? userInfo[1] : "";

        var pgConn = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Database = uri.AbsolutePath.TrimStart('/'),
            Username = username,
            Password = password,
            SslMode = SslMode.Require,
            TrustServerCertificate = true, // Required for Render PostgreSQL
            Pooling = true,
            MinPoolSize = 1,
            MaxPoolSize = 20,
            ConnectionIdleLifetime = 300,
            KeepAlive = 30,
            Timeout = 60,
            CommandTimeout = 60,
            IncludeErrorDetail = true
        };

        // Special settings for Render
        if (uri.Host.Contains("render.com"))
        {
            Console.WriteLine("Using Render PostgreSQL optimized settings");
            pgConn.SslMode = SslMode.Require;
            pgConn.TrustServerCertificate = true;
            pgConn.Pooling = true;
            pgConn.MinPoolSize = 1;
            pgConn.MaxPoolSize = 10;
        }

        connString = pgConn.ToString();
        Console.WriteLine($"Using PostgreSQL: {pgConn.Host}:{pgConn.Port}/{pgConn.Database}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error parsing PostgreSQL URI: {ex.Message}");
        // Keep original connection string
    }
}
else
{
    Console.WriteLine("Using default SQLite database");
}

// Add DbContext with retry logic
builder.Services.AddDbContext<AppDbContext>(opt =>
{
    if (connString.Contains("Host="))
    {
        Console.WriteLine("Configuring PostgreSQL with retry logic");
        opt.UseNpgsql(connString, options =>
        {
            options.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorCodesToAdd: null);
            
            options.CommandTimeout(60);
            options.MigrationsAssembly(typeof(Program).Assembly.FullName);
        });
    }
    else
    {
        Console.WriteLine("Configuring SQLite");
        opt.UseSqlite(connString);
    }
    
    if (builder.Environment.IsDevelopment())
    {
        opt.EnableSensitiveDataLogging();
        opt.EnableDetailedErrors();
    }
});

// SERVICES
builder.Services.AddScoped<AuthService>();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.WriteIndented = true;
    });

// SWAGGER
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// JWT AUTH
var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY") 
             ?? builder.Configuration["Jwt:Key"] 
             ?? "DEVELOPMENT_KEY_ONLY_CHANGE_FOR_PRODUCTION";

var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER") 
             ?? builder.Configuration["Jwt:Issuer"] 
             ?? "BookWebApp";

var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") 
               ?? builder.Configuration["Jwt:Audience"] 
               ?? "BookWebAppUsers";

var key = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ClockSkew = TimeSpan.Zero,
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
        };
        
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"Authentication failed: {context.Exception.Message}");
                return Task.CompletedTask;
            }
        };
    });

// CORS: Allow frontend + localhost
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

// RENDER PORT
builder.WebHost.ConfigureKestrel(options =>
{
    var port = Environment.GetEnvironmentVariable("PORT");
    if (!string.IsNullOrEmpty(port))
    {
        Console.WriteLine($"Using PORT from environment: {port}");
        options.ListenAnyIP(int.Parse(port));
    }
    else
    {
        Console.WriteLine("Using default port 5000");
        options.ListenAnyIP(5000);
    }
});

var app = builder.Build();

// INITIALIZE DATABASE with proper migration handling
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    
    Console.WriteLine("Initializing database...");
    
    try
    {
        // First, try to apply migrations
        Console.WriteLine("Applying migrations...");
        db.Database.Migrate();
        Console.WriteLine("Migrations applied successfully");
        
        // Verify tables exist
        var booksExist = db.Database.CanConnect() && db.Books.Any();
        var usersExist = db.Database.CanConnect() && db.Users.Any();
        Console.WriteLine($"Books table exists: {booksExist}");
        Console.WriteLine($"Users table exists: {usersExist}");
        
        // Create a default admin user if no users exist
        if (!db.Users.Any())
        {
            Console.WriteLine("No users found. Database is empty.");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Migration error: {ex.Message}");
        
        // Fallback: Try to create tables
        try
        {
            Console.WriteLine("Attempting to create database using EnsureCreated...");
            db.Database.EnsureCreated();
            Console.WriteLine("Database created using EnsureCreated");
        }
        catch (Exception ex2)
        {
            Console.WriteLine($"EnsureCreated also failed: {ex2.Message}");
        }
    }
}

// MIDDLEWARE ORDER IS CRUCIAL
app.UseRouting();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

// SWAGGER DEV
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "BookWebApp API v1");
        c.RoutePrefix = "swagger";
    });
    Console.WriteLine("Swagger UI enabled at /swagger");
}

// Health check endpoints
app.MapGet("/health", async (AppDbContext dbContext) =>
{
    try
    {
        var canConnect = await dbContext.Database.CanConnectAsync();
        var bookCount = canConnect ? await dbContext.Books.CountAsync() : 0;
        var userCount = canConnect ? await dbContext.Users.CountAsync() : 0;
        
        return Results.Ok(new 
        { 
            status = "healthy", 
            timestamp = DateTime.UtcNow,
            database = canConnect ? "connected" : "disconnected",
            counts = new { books = bookCount, users = userCount }
        });
    }
    catch (Exception ex)
    {
        return Results.Problem(
            title: "Database connection failed",
            detail: ex.Message,
            statusCode: 503);
    }
});

app.MapGet("/debug/db", (AppDbContext dbContext) =>
{
    try
    {
        var conn = dbContext.Database.GetDbConnection();
        var connString = conn.ConnectionString ?? "";
        
        // Hide password from logs
        var hiddenConnString = connString;
        var passwordMatch = System.Text.RegularExpressions.Regex.Match(connString, @"Password=([^;]+)");
        if (passwordMatch.Success)
        {
            hiddenConnString = connString.Replace(passwordMatch.Value, "Password=***");
        }
        
        return Results.Ok(new
        {
            database = conn.Database,
            dataSource = conn.DataSource,
            state = conn.State.ToString(),
            connectionString = hiddenConnString,
            provider = dbContext.Database.ProviderName
        });
    }
    catch (Exception ex)
    {
        return Results.Ok(new { error = ex.Message });
    }
});

// MAP CONTROLLERS
app.MapControllers();

// LOG INFO
Console.WriteLine("========================================");
Console.WriteLine("BookWebApp API running!");
Console.WriteLine($"Environment: {app.Environment.EnvironmentName}");
Console.WriteLine($"JWT Issuer: {issuer}");
Console.WriteLine($"JWT Audience: {audience}");
Console.WriteLine($"Database: {(connString.Contains("Host=") ? "PostgreSQL" : "SQLite")}");
Console.WriteLine("CORS Allowed Origins:");
Console.WriteLine(" - https://book-quotes-web-app-frontend.onrender.com");
Console.WriteLine(" - http://localhost:4200");
Console.WriteLine("========================================");

app.Run();