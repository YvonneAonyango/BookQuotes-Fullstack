using System.Text;
using BookWebApp.Api.Data;
using BookWebApp.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

// Create builder
var builder = WebApplication.CreateBuilder(args);

// =========================
// CONFIGURATION
// =========================

// Load appsettings.json and environment variables
builder.Configuration
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddEnvironmentVariables();

// =========================
// DATABASE
// =========================

// SQLite for development; change to PostgreSQL if needed for production
builder.Services.AddDbContext<AppDbContext>(opt =>
{
    var connString = builder.Configuration.GetConnectionString("DefaultConnection") 
                     ?? "Data Source=books.db";
    opt.UseSqlite(connString);
});

// =========================
// SERVICES
// =========================
builder.Services.AddScoped<AuthService>();
builder.Services.AddControllers();

// =========================
// SWAGGER
// =========================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// =========================
// JWT AUTHENTICATION
// =========================

// Read JWT Key with priority: Env Variable > Appsettings
var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY") 
             ?? builder.Configuration["Jwt:Key"];

if (string.IsNullOrEmpty(jwtKey))
{
    if (builder.Environment.IsDevelopment())
    {
        // Load development key
        builder.Configuration.AddJsonFile("appsettings.Development.json", optional: true, reloadOnChange: true);
        jwtKey = builder.Configuration["Jwt:Key"] 
                 ?? "DEVELOPMENT_KEY_ONLY_CHANGE_FOR_PRODUCTION";
        Console.WriteLine("⚠️ WARNING: Using development JWT key.");
    }
    else
    {
        throw new InvalidOperationException(
            "JWT Key not configured. Set JWT_KEY environment variable or configure in appsettings.Production.json"
        );
    }
}

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
            ClockSkew = TimeSpan.Zero
        };

        // Optional: debug events
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
            }
        };
    });

// =========================
// CORS
// =========================
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("AllowAll", policy =>
        policy.WithOrigins(
                "http://localhost:4200",        // Angular dev
                "http://localhost:5298",        // API dev
                "https://your-frontend-domain"  // Replace with deployed frontend
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

// =========================
// BUILD APP
// =========================
var app = builder.Build();

// Initialize database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    Console.WriteLine("Database initialized");
}

// =========================
// MIDDLEWARE
// =========================
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

// Swagger only in development
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

// Map controllers
app.MapControllers();

// =========================
// LOG STARTUP INFO
// =========================
Console.WriteLine("========================================");
Console.WriteLine(" BookWebApp API running!");
Console.WriteLine($" Environment: {app.Environment.EnvironmentName}");
Console.WriteLine($" JWT Issuer: {issuer}");
Console.WriteLine($" JWT Audience: {audience}");
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
