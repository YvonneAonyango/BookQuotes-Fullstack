using System.Text;
using BookWebApp.Api.Data;
using BookWebApp.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

// ------------------------
// CREATE BUILDER
// ------------------------
var builder = WebApplication.CreateBuilder(args);

// ------------------------
// CONFIGURATION
// ------------------------
builder.Configuration
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddEnvironmentVariables();

// ------------------------
// DATABASE
// ------------------------
builder.Services.AddDbContext<AppDbContext>(opt =>
{
    var connString = builder.Configuration.GetConnectionString("DefaultConnection")
                     ?? "Data Source=books.db";
    opt.UseSqlite(connString);
});

// ------------------------
// SERVICES
// ------------------------
builder.Services.AddScoped<AuthService>();
builder.Services.AddControllers();

// ------------------------
// SWAGGER
// ------------------------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ------------------------
// JWT AUTHENTICATION
// ------------------------
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
            ClockSkew = TimeSpan.Zero
        };
    });

// ------------------------
// CORS  (FIXED FOR RENDER)
// ------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(
                "http://localhost:4200",
                "https://book-quotes-web-app-frontend.onrender.com"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .SetIsOriginAllowedToAllowWildcardSubdomains()
    );
});

// ------------------------
// RENDER PORT BINDING (REQUIRED)
// ------------------------
builder.WebHost.ConfigureKestrel(options =>
{
    var port = Environment.GetEnvironmentVariable("PORT");
    if (!string.IsNullOrEmpty(port))
    {
        options.ListenAnyIP(int.Parse(port));
    }
});

// ------------------------
// BUILD APP
// ------------------------
var app = builder.Build();

// Initialize database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    Console.WriteLine("Database initialized");
}

// ------------------------
// MIDDLEWARE
// ------------------------
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

// Swagger in dev only
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

// Map controllers
app.MapControllers();

// ------------------------
// LOG STARTUP INFO
// ------------------------
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