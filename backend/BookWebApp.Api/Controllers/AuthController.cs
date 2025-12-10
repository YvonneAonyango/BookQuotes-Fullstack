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

    // -----------------------------------------------
    // TEST ENDPOINT
    // -----------------------------------------------
    [HttpGet("test")]
    public IActionResult Test()
    {
        return Ok(new
        {
            message = "Auth API is working!",
            timestamp = DateTime.UtcNow,
            jwtConfigured = !string.IsNullOrEmpty(_config["Jwt:Key"])
        });
    }

    // -----------------------------------------------
    // SETUP ADMIN ACCOUNT (ONE TIME USE)
    // -----------------------------------------------
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
                _logger.LogInformation("Admin created: {Username}", model.Username);
                return Ok(new { message = "Admin user created successfully" });
            }

            return BadRequest(new { message = "Failed to create admin user" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting up admin user");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // -----------------------------------------------
    // REGISTER USER
    // -----------------------------------------------
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto model)
    {
        try
        {
            _logger.LogInformation("Register attempt for {Username}", model.Username);

            if (string.IsNullOrWhiteSpace(model.Username) || string.IsNullOrWhiteSpace(model.Password))
                return BadRequest(new { message = "Username and password are required" });

            if (model.Password != model.ConfirmPassword)
                return BadRequest(new { message = "Passwords do not match" });

            if (model.Password.Length < 6)
                return BadRequest(new { message = "Password must be at least 6 characters long" });

            // Default role to User
            if (string.IsNullOrEmpty(model.Role))
                model.Role = "User";

            if (model.Role != "User" && model.Role != "Admin")
                return BadRequest(new { message = "Invalid role. Must be 'User' or 'Admin'" });

            var user = await _authService.Register(model.Username, model.Password, model.Role);
            if (user == null)
                return BadRequest(new { message = "Username already exists" });

            var token = GenerateJwtToken(user);

            return Ok(new
            {
                token,
                username = user.Username,
                role = user.Role.ToString(),
                message = "Registration successful"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // -----------------------------------------------
    // LOGIN USER
    // -----------------------------------------------
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto model)
    {
        try
        {
            _logger.LogInformation("Login attempt for {Username}", model.Username);

            if (string.IsNullOrWhiteSpace(model.Username) || string.IsNullOrWhiteSpace(model.Password))
                return BadRequest(new { message = "Username and password are required" });

            var user = await _authService.Login(model.Username, model.Password);
            if (user == null)
                return Unauthorized(new { message = "Invalid credentials" });

            var token = GenerateJwtToken(user);

            return Ok(new
            {
                token,
                username = user.Username,
                role = user.Role.ToString(),
                message = "Login successful"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // -----------------------------------------------
    // LOGIN ADMIN ONLY
    // -----------------------------------------------
    [HttpPost("admin/login")]
    public async Task<IActionResult> AdminLogin([FromBody] LoginDto model)
    {
        try
        {
            var user = await _authService.Login(model.Username, model.Password);

            if (user == null || user.Role != UserRole.Admin)
                return Unauthorized(new { message = "Invalid admin credentials" });

            var token = GenerateJwtToken(user);

            return Ok(new
            {
                token,
                username = user.Username,
                role = user.Role.ToString(),
                message = "Admin login successful"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // -----------------------------------------------
    // LOGOUT
    // -----------------------------------------------
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return Ok(new { message = "Logged out successfully. Remove token client-side." });
    }

    // -----------------------------------------------
    // JWT VALIDATION
    // -----------------------------------------------
    [HttpPost("validate-token")]
    public IActionResult ValidateToken([FromBody] ValidateTokenDto model)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]);

            handler.ValidateToken(model.Token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _config["Jwt:Issuer"],
                ValidateAudience = true,
                ValidAudience = _config["Jwt:Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validated);

            var jwt = (JwtSecurityToken)validated;

            return Ok(new
            {
                valid = true,
                username = jwt.Claims.First(c => c.Type == ClaimTypes.Name).Value,
                role = jwt.Claims.First(c => c.Type == ClaimTypes.Role).Value,
                expires = jwt.ValidTo
            });
        }
        catch
        {
            return Ok(new { valid = false });
        }
    }

    // -----------------------------------------------
    // GET CURRENT USER WITH TOKEN
    // -----------------------------------------------
    [HttpGet("user-info")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> GetUserInfo()
    {
        var username = User.Identity?.Name;
        if (username == null)
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

    // -----------------------------------------------
    // JWT TOKEN GENERATION
    // -----------------------------------------------
    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? throw new Exception("Missing JWT key")));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

// DTOs

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
