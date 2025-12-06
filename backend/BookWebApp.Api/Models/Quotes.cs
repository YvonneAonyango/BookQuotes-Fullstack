using System.ComponentModel.DataAnnotations;

namespace BookWebApp.Api.Models;

public class Quote
{
    public int Id { get; set; }

    [Required]
    public string Text { get; set; } = "";

    // Link to Book
    [Required]
    public int BookId { get; set; }
    public Book? Book { get; set; }

    // Link to User (owner)
    [Required]
    public int UserId { get; set; }
    public User? User { get; set; }
}
