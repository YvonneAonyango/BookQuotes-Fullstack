using System.ComponentModel.DataAnnotations;

namespace BookWebApp.Api.Models;

public class Book
{
    public int Id { get; set; }

    [Required]
    public string Title { get; set; } = "";

    [Required]
    public string Author { get; set; } = "";

    public DateTime? PublishDate { get; set; }
}
