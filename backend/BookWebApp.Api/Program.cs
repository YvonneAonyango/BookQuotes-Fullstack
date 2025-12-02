using System.Text;
using BookWebApp.Api.Data;
using BookWebApp.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services
// Load appsettings.json but allow environment variables to override
builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);

// Database - SQLite for development
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite("Data Source=books.db"));

// Services
builder.Services.AddScoped<AuthService>();
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// JWT Authentication - SECURE VERSION
var jwtKey = builder.Configuration["Jwt:Key"];

// Priority: Environment Variable > appsettings.json > Throw error
if (string.IsNullOrEmpty(jwtKey))
{
    // Check environment variable for production
    jwtKey = Environment.GetEnvironmentVariable("JWT_KEY");
    
    if (string.IsNullOrEmpty(jwtKey))
    {
        // For development, check if we're in Development environment
        if (builder.Environment.IsDevelopment())
        {
            // Try to load from development settings
            builder.Configuration.AddJsonFile("appsettings.Development.json", optional: true, reloadOnChange: true);
            jwtKey = builder.Configuration["Jwt:Key"];
            
            if (string.IsNullOrEmpty(jwtKey))
            {
                // In development, use a placeholder but warn
                jwtKey = "DEVELOPMENT_KEY_ONLY_CHANGE_FOR_PRODUCTION";
                Console.WriteLine("⚠️ WARNING: Using development JWT key. Generate a secure key for production!");
            }
        }
        else
        {
            throw new InvalidOperationException(
                "JWT Key not configured. Set JWT_KEY environment variable " +
                "or configure in appsettings.Production.json");
        }
    }
}

var issuer = builder.Configuration["Jwt:Issuer"] ?? 
             Environment.GetEnvironmentVariable("JWT_ISSUER") ?? 
             "BookWebApp";

var audience = builder.Configuration["Jwt:Audience"] ?? 
               Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? 
               "BookWebAppUsers";

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
            ClockSkew = TimeSpan.Zero // Optional: Remove default 5-minute clock skew
        };
        
        // Optional: For debugging token issues
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"JWT Authentication Failed: {context.Exception.Message}");
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                Console.WriteLine($"JWT Token Validated for user: {context.Principal?.Identity?.Name}");
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                Console.WriteLine($"JWT Challenge: {context.Error}, {context.ErrorDescription}");
                return Task.CompletedTask;
            }
        };
    });

// CORS
builder.Services.AddCors(opt =>
    opt.AddPolicy("AllowAll", policy =>
        policy.WithOrigins(
                "http://localhost:4200",     // Angular dev server
                "http://localhost:5298",     // API dev server
                "https://your-vercel-app.vercel.app" // Your deployed frontend
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()));

var app = builder.Build();

// Initialize database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    Console.WriteLine("Database initialized");
}

// Middleware order
app.UseCors("AllowAll");
app.UseAuthentication(); // JWT authentication
app.UseAuthorization();

// Swagger UI - Only in development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => 
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "BookWebApp API v1");
        c.RoutePrefix = "swagger";
    });
    
    Console.WriteLine("🔓 Development Mode: Swagger UI enabled at /swagger");
}
else
{
    Console.WriteLine("🔒 Production Mode: Swagger UI disabled");
}

app.MapControllers();

// Log startup information
Console.WriteLine("========================================");
Console.WriteLine(" BookWebApp API running!");
Console.WriteLine($" Environment: {app.Environment.EnvironmentName}");
Console.WriteLine($" JWT Issuer: {issuer}");
Console.WriteLine($" JWT Audience: {audience}");
Console.WriteLine("========================================");

if (app.Environment.IsDevelopment())
{
    Console.WriteLine(" Local URLs:");
    Console.WriteLine(" - Swagger UI: http://localhost:5298/swagger");
    Console.WriteLine(" - API Base: http://localhost:5298/api");
    Console.WriteLine(" - Frontend: http://localhost:4200");
}

Console.WriteLine(" Authentication: JWT (Token-based)");
Console.WriteLine("========================================");

app.Run();