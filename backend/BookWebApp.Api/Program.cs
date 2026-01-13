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

// DATABASE
var connString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")
                 ?? builder.Configuration.GetConnectionString("DefaultConnection")
                 ?? "Data Source=books.db";

// PostgreSQL URI -> connection string
if (connString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
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
        SslMode = SslMode.Require
        // TrustServerCertificate removed (obsolete)
    };

    connString = pgConn.ToString();
}

// Add DbContext
builder.Services.AddDbContext<AppDbContext>(opt =>
{
    if (connString.Contains("Host="))
        opt.UseNpgsql(connString);
    else
        opt.UseSqlite(connString);
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
        options.ListenAnyIP(int.Parse(port));
});

var app = builder.Build();

// INITIALIZE DATABASE
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    Console.WriteLine("Database initialized");
}

// MIDDLEWARE ORDER IS CRUCIAL
app.UseRouting();                 // must come first
app.UseCors("AllowFrontend");     // <-- CORS BEFORE auth
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

// MAP CONTROLLERS
app.MapControllers();

// LOG INFO
Console.WriteLine("========================================");
Console.WriteLine("BookWebApp API running!");
Console.WriteLine($"Environment: {app.Environment.EnvironmentName}");
Console.WriteLine($"JWT Issuer: {issuer}");
Console.WriteLine($"JWT Audience: {audience}");
Console.WriteLine("CORS Allowed Origins:");
Console.WriteLine(" - https://book-quotes-web-app-frontend.onrender.com");
Console.WriteLine(" - http://localhost:4200");
Console.WriteLine("========================================");

app.Run();