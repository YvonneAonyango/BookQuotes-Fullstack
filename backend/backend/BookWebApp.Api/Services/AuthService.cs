using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using BookWebApp.Api.Models;
using BookWebApp.Api.Data;
using System;
using System.Threading.Tasks;
using System.Security.Cryptography;
using System.Text;
using System.Linq;

namespace BookWebApp.Api.Services
{
    public class AuthService
    {
        private readonly AppDbContext _context; // Changed from ApplicationDbContext
        private readonly IConfiguration _config;

        public AuthService(AppDbContext context, IConfiguration config) // Changed here too
        {
            _context = context;
            _config = config;
        }

        // Register method that accepts string role
        public async Task<User?> Register(string username, string password, string role = "User")
        {
            try
            {
                Console.WriteLine($"=== REGISTER DEBUG ===");
                Console.WriteLine($"Username: {username}");
                Console.WriteLine($"Role requested: {role}");
                
                // Check if user exists
                if (await _context.Users.AnyAsync(u => u.Username == username))
                {
                    Console.WriteLine("❌ Username already exists");
                    return null;
                }

                // Convert string role to UserRole enum
                UserRole userRole;
                if (Enum.TryParse<UserRole>(role, true, out userRole))
                {
                    Console.WriteLine($"✅ Role parsed: {userRole}");
                }
                else
                {
                    Console.WriteLine($"⚠️ Invalid role '{role}', defaulting to User");
                    userRole = UserRole.User;
                }

                // Create password hash
                CreatePasswordHash(password, out byte[] passwordHash, out byte[] passwordSalt);

                // Create user
                var user = new User
                {
                    Username = username,
                    PasswordHash = passwordHash,
                    PasswordSalt = passwordSalt,
                    Role = userRole
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                Console.WriteLine($"✅ User registered: ID={user.Id}, Username='{user.Username}', Role='{user.Role}'");
                Console.WriteLine($"=== END REGISTER ===");
                
                return user;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"!!! REGISTER EXCEPTION: {ex.Message}");
                return null;
            }
        }

        // Overloaded method for backward compatibility
        public async Task<User?> Register(string username, string password, UserRole role = UserRole.User)
        {
            return await Register(username, password, role.ToString());
        }

        // Login method
        public async Task<User?> Login(string username, string password)
        {
            try
            {
                Console.WriteLine($"=== LOGIN DEBUG ===");
                Console.WriteLine($"Username: {username}");
                
                // Try exact match first
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
                
                // If not found, try case-insensitive
                if (user == null)
                {
                    user = await _context.Users.FirstOrDefaultAsync(u => 
                        u.Username.ToLower() == username.ToLower());
                }
                
                if (user == null)
                {
                    Console.WriteLine("❌ User not found in database");
                    return null;
                }

                Console.WriteLine($"User found: ID={user.Id}, Username='{user.Username}', Role='{user.Role}'");
                Console.WriteLine($"Stored PasswordHash length: {user.PasswordHash?.Length ?? 0}");
                Console.WriteLine($"Stored PasswordSalt length: {user.PasswordSalt?.Length ?? 0}");
                
                if (user.PasswordHash == null || user.PasswordSalt == null)
                {
                    Console.WriteLine("❌ User has null password hash/salt!");
                    return null;
                }

                var isValid = VerifyPasswordHash(password, user.PasswordHash, user.PasswordSalt);
                Console.WriteLine($"Password valid: {isValid}");
                
                Console.WriteLine($"=== END LOGIN ===");
                return isValid ? user : null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"!!! LOGIN EXCEPTION: {ex.Message}");
                return null;
            }
        }

        // Check if user exists
        public async Task<bool> UserExists(string username)
        {
            return await _context.Users.AnyAsync(u => u.Username == username);
        }

        // Get user by username
        public async Task<User?> GetUserByUsername(string username)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
        }

        // Create admin user (for setup)
        public async Task<bool> CreateAdminUser(string username, string password)
        {
            try
            {
                Console.WriteLine($"=== CREATE ADMIN USER ===");
                
                // Check if any admin already exists
                var adminExists = await _context.Users.AnyAsync(u => u.Role == UserRole.Admin);
                if (adminExists)
                {
                    Console.WriteLine("⚠️ Admin user already exists");
                    return false;
                }

                // Create password hash
                CreatePasswordHash(password, out byte[] passwordHash, out byte[] passwordSalt);

                // Create admin user
                var adminUser = new User
                {
                    Username = username,
                    PasswordHash = passwordHash,
                    PasswordSalt = passwordSalt,
                    Role = UserRole.Admin
                };

                _context.Users.Add(adminUser);
                await _context.SaveChangesAsync();

                Console.WriteLine($"✅ Admin user created: {username}");
                Console.WriteLine($"=== END CREATE ADMIN ===");
                
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"!!! CREATE ADMIN EXCEPTION: {ex.Message}");
                return false;
            }
        }

        // Password hashing methods
        private void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
        {
            using (var hmac = new HMACSHA512())
            {
                passwordSalt = hmac.Key;
                passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
            }
        }

        private bool VerifyPasswordHash(string password, byte[] storedHash, byte[] storedSalt)
        {
            using (var hmac = new HMACSHA512(storedSalt))
            {
                var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
                return computedHash.SequenceEqual(storedHash);
            }
        }

        // Generate JWT token (optional - can be in controller)
        public string GenerateJwtToken(User user)
        {
            var tokenHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is not configured"));
            
            var tokenDescriptor = new Microsoft.IdentityModel.Tokens.SecurityTokenDescriptor
            {
                Subject = new System.Security.Claims.ClaimsIdentity(new[]
                {
                    new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Name, user.Username),
                    new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, user.Role.ToString())
                }),
                Expires = DateTime.UtcNow.AddHours(24),
                SigningCredentials = new Microsoft.IdentityModel.Tokens.SigningCredentials(
                    new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(key), 
                    Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256Signature)
            };
            
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}