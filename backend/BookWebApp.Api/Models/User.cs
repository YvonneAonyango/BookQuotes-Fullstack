using System.ComponentModel.DataAnnotations;

namespace BookWebApp.Api.Models;

public class User
{
    public int Id { get; set; }

    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public required byte[] PasswordHash { get; set; }

    [Required]
    public required byte[] PasswordSalt { get; set; }

    //  Role property for admin system
    public UserRole Role { get; set; } = UserRole.User;
}

public enum UserRole
{
    User = 0,
    Admin = 1
}