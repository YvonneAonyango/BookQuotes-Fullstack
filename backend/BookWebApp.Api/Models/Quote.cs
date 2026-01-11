// BookWebApp.Api/Models/Quote.cs
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BookWebApp.Api.Models;

public class Quote
{
    public int Id { get; set; }

    [Required]
    public string Text { get; set; } = "";

    [Required]
    public string Author { get; set; } = "";

    public int? BookId { get; set; }

    [JsonIgnore]
    public Book? Book { get; set; }

    [Required]
    public int UserId { get; set; }
    
    [JsonIgnore]
    public User? User { get; set; }
    
    // global property
    public bool IsGlobal { get; set; } = false;
}