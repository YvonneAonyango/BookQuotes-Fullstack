using System.ComponentModel.DataAnnotations;

namespace BookWebApp.Api.Models;

public class User
{
    public int Id { get; set; }

    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public byte[] PasswordHash { get; set; } = Array.Empty<byte>();

    [Required]
    public byte[] PasswordSalt { get; set; } = Array.Empty<byte>();

    public UserRole Role { get; set; } = UserRole.User;

    // Navigation
    public ICollection<Quote> Quotes { get; set; } = new List<Quote>();
}

public enum UserRole
{
    User = 0,
    Admin = 1
}