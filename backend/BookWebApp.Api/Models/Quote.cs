using System.ComponentModel.DataAnnotations;

namespace BookWebApp.Api.Models;

public class Quote
{
    public int Id { get; set; }

    [Required]
    public string Text { get; set; } = "";

    [Required]  // ← This line
    public string Author { get; set; } = "";  // ← This property

    public int? BookId { get; set; }  // ← Note the ? (nullable)
    public Book? Book { get; set; }

    [Required]
    public int UserId { get; set; }
    public User? User { get; set; }
}