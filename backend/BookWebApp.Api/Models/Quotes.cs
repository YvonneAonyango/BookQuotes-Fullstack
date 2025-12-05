using System.ComponentModel.DataAnnotations;

namespace BookWebApp.Api.Models;

public class Quote
{
    public int Id { get; set; }

    [Required]
    public string Text { get; set; } = "";
}
