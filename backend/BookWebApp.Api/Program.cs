using System.Text;
using BookWebApp.Api.Data;
using BookWebApp.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// =========================
// REQUIRED FOR RENDER
// =========================
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
// =========================

// JWT Settings
var JWT_KEY = builder.Configuration["Jwt:Key"]!;
builder.Configuration["Jwt:Issuer"] = "BookWebApp";
builder.Configuration["Jwt:Audience"] = "BookWebAppUsers";

// Database - PostgreSQL on Render
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Services
builder.Services.AddScoped<AuthService>();
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// JWT Authentication
var key = Encoding.UTF8.GetBytes(JWT_KEY);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "BookWebApp",
            ValidAudience = "BookWebAppUsers",
            IssuerSigningKey = new SymmetricSecurityKey(key)
        };
    });

// CORS
builder.Services.AddCors(opt =>
    opt.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod()));

var app = builder.Build();

// Apply pending migrations on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    Console.WriteLine("Database migrated and ready!");
}

// Middleware
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

// Swagger
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "BookWebApp API v1");
    c.RoutePrefix = "swagger";
});

app.MapControllers();

Console.WriteLine("========================================");
Console.WriteLine("BookWebApp API running!");
Console.WriteLine("Listening on port: " + port);
Console.WriteLine("========================================");

app.Run();
