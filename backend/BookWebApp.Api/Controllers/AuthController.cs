using BookWebApp.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BookWebApp.Api.Models;

namespace BookWebApp.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthController> _logger;

    public AuthController(AuthService authService, IConfiguration config, ILogger<AuthController> logger)
    {
        _authService = authService;
        _config = config;
        _logger = logger;
    }

    // -------------------------
    // Test endpoint - check if API is working
    // -------------------------
    [HttpGet("test")]
    public IActionResult Test()
    {
        return Ok(new { 
            message = "Auth API is working!", 
            timestamp = DateTime.UtcNow,
            jwtConfigured = !string.IsNullOrEmpty(_config["Jwt:Key"])
        });
    }

    // -------------------------
    // Setup initial admin user (call this once)
    // -------------------------
    [HttpPost("setup-admin")]
    public async Task<IActionResult> SetupAdmin([FromBody] SetupAdminDto model)
    {
        try
        {
            _logger.LogInformation("Setting up admin user: {Username}", model.Username);

            if (string.IsNullOrWhiteSpace(model.Username) || string.IsNullOrWhiteSpace(model.Password))
                return BadRequest(new { message = "Username and password are required" });

            if (model.Password != model.ConfirmPassword)
                return BadRequest(new { message = "Passwords do not match" });

            if (model.Password.Length < 6)
                return BadRequest(new { message = "Password must be at least 6 characters long" });

            var success = await _authService.CreateAdminUser(model.Username, model.Password);
            
            if (success)
            {
                _logger.LogInformation("Admin user setup successfully: {Username}", model.Username);
                return Ok(new { message = "Admin user created successfully" });
            }
            else
            {
                return BadRequest(new { message = "Failed to create admin user" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting up admin user: {Username}", model.Username);
            return StatusCode(500, new { message = $"An error occurred: {ex.Message}" });
        }
    }

    // -------------------------
    // Register a new user - UPDATED WITH ROLE SUPPORT
    // -------------------------
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto model)
    {
        try
        {
            _logger.LogInformation("Registration attempt for user: {Username} with role: {Role}", model.Username, model.Role);

            // Input validation
            if (string.IsNullOrWhiteSpace(model.Username) || string.IsNullOrWhiteSpace(model.Password))
                return BadRequest(new { message = "Username and password are required" });

            if (model.Password != model.ConfirmPassword)
                return BadRequest(new { message = "Passwords do not match" });

            if (model.Password.Length < 6)
                return BadRequest(new { message = "Password must be at least 6 characters long" });

            // Set default role if not provided
            if (string.IsNullOrEmpty(model.Role))
                model.Role = "User";

            // Validate role
            if (model.Role != "User" && model.Role != "Admin")
                return BadRequest(new { message = "Invalid role. Must be 'User' or 'Admin'" });

            // Call Register with string role
            var user = await _authService.Register(model.Username, model.Password, model.Role);
            if (user == null)
            {
                _logger.LogWarning("Registration failed - username already exists: {Username}", model.Username);
                return BadRequest(new { message = "Username already exists" });
            }

            // Generate JWT token
            var token = GenerateJwtToken(user);
            
            _logger.LogInformation("User registered successfully: {Username} with role: {Role}", model.Username, user.Role);
            
            return Ok(new { 
                token = token,
                username = user.Username,
                role = user.Role.ToString(),
                message = "Registration successful" 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration for user: {Username}", model.Username);
            return StatusCode(500, new { message = $"An error occurred: {ex.Message}" });
        }
    }

    // -------------------------
    // Login (JWT Token)
    // -------------------------
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto model)
    {
        try
        {
            _logger.LogInformation("Login attempt for user: {Username}", model.Username);

            if (string.IsNullOrWhiteSpace(model.Username) || string.IsNullOrWhiteSpace(model.Password))
                return BadRequest(new { message = "Username and password are required" });

            var user = await _authService.Login(model.Username, model.Password);
            if (user == null)
            {
                _logger.LogWarning("Login failed for user: {Username}", model.Username);
                return Unauthorized(new { message = "Invalid credentials" });
            }

            // Generate JWT token
            var token = GenerateJwtToken(user);
            
            _logger.LogInformation("User logged in successfully: {Username} with role: {Role}", model.Username, user.Role);
            
            return Ok(new { 
                token = token,
                username = user.Username,
                role = user.Role.ToString(),
                message = "Login successful" 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for user: {Username}", model.Username);
            return StatusCode(500, new { message = $"An error occurred: {ex.Message}" });
        }
    }

    // -------------------------
    // ADMIN LOGIN (JWT Token - same as regular login but role check)
    // -------------------------
    [HttpPost("admin/login")]
    public async Task<IActionResult> AdminLogin([FromBody] LoginDto model)
    {
        try
        {
            _logger.LogInformation("Admin login attempt for user: {Username}", model.Username);

            var user = await _authService.Login(model.Username, model.Password);
            if (user == null || user.Role != UserRole.Admin)
            {
                _logger.LogWarning("Admin login failed for user: {Username}", model.Username);
                return Unauthorized(new { message = "Invalid admin credentials" });
            }

            // Generate JWT token
            var token = GenerateJwtToken(user);
            
            _logger.LogInformation("Admin logged in successfully: {Username}", model.Username);
            
            return Ok(new { 
                token = token,
                username = user.Username,
                role = user.Role.ToString(),
                message = "Admin login successful" 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during admin login for user: {Username}", model.Username);
            return StatusCode(500, new { message = $"An error occurred: {ex.Message}" });
        }
    }

    // -------------------------
    // Logout (JWT - client removes token)
    // -------------------------
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return Ok(new { message = "Logged out successfully. Please remove token client-side." });
    }

    // -------------------------
    // Check current user status
    // -------------------------
    [HttpGet("current-user")]
    public IActionResult GetCurrentUser()
    {
        // For JWT, this would require [Authorize] attribute
        // and reading from HttpContext.User
        return Ok(new { 
            message = "Use token validation on protected endpoints",
            note = "Client should store and send token in Authorization header"
        });
    }

    // -------------------------
    // Validate token (optional)
    // -------------------------
    [HttpPost("validate-token")]
    public IActionResult ValidateToken([FromBody] ValidateTokenDto model)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]);
            
            tokenHandler.ValidateToken(model.Token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _config["Jwt:Issuer"],
                ValidateAudience = true,
                ValidAudience = _config["Jwt:Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            var jwtToken = (JwtSecurityToken)validatedToken;
            var username = jwtToken.Claims.First(x => x.Type == ClaimTypes.Name).Value;
            var role = jwtToken.Claims.First(x => x.Type == ClaimTypes.Role).Value;
            
            return Ok(new {
                valid = true,
                username = username,
                role = role,
                expires = jwtToken.ValidTo
            });
        }
        catch
        {
            return Ok(new { valid = false });
        }
    }

    // -------------------------
    // Test endpoint - check if user exists
    // -------------------------
    [HttpGet("check/{username}")]
    public async Task<IActionResult> CheckUserExists(string username)
    {
        try
        {
            var exists = await _authService.UserExists(username);
            return Ok(new { username, exists });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error checking user: {ex.Message}" });
        }
    }

    // -------------------------
    // JWT Token Generator
    // -------------------------
    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _config["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is not configured")));
        
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        // Token valid for 24 hours
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "BookWebApp",
            audience: _config["Jwt:Audience"] ?? "BookWebAppUsers",
            claims: claims,
            expires: DateTime.Now.AddHours(24),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // -------------------------
    // Debug endpoint - get user info (requires authorization)
    // -------------------------
    [HttpGet("user-info")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> GetUserInfo()
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrEmpty(username))
            return Unauthorized();

        var user = await _authService.GetUserByUsername(username);
        if (user == null)
            return NotFound();

        return Ok(new
        {
            id = user.Id,
            username = user.Username,
            role = user.Role.ToString()
        });
    }
}

// -------------------------
// DTOs for requests - MAKE SURE RegisterDto HAS ROLE PROPERTY
// -------------------------
public class RegisterDto
{
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public string ConfirmPassword { get; set; } = "";
    public string Role { get; set; } = "User"; 
}

public class LoginDto
{
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
}

public class SetupAdminDto
{
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public string ConfirmPassword { get; set; } = "";
}

public class ValidateTokenDto
{
    public string Token { get; set; } = "";
}