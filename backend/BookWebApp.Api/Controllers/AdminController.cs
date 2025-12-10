using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using BookWebApp.Api.Data;
using BookWebApp.Api.Models;

namespace BookWebApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/admin/users
    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<object>>> GetUsers()
    {
        var users = await _context.Users
            .Select(u => new 
            {
                u.Id,
                u.Username,
                Role = u.Role.ToString(),
                RegisteredDate = "N/A"
            })
            .ToListAsync();

        return Ok(users);
    }

    // GET: api/admin/books
    [HttpGet("books")]
    public async Task<ActionResult<IEnumerable<object>>> GetBooks()
    {
        var books = await _context.Books
            .Include(b => b.Quotes)
            .Select(b => new 
            {
                b.Id,
                b.Title,
                b.Author,
                b.PublishDate,
                b.UserId,
                QuoteCount = b.Quotes.Count
            })
            .ToListAsync();

        return Ok(books);
    }

    // GET: api/admin/quotes
    [HttpGet("quotes")]
    public async Task<ActionResult<IEnumerable<object>>> GetQuotes()
    {
        var quotes = await _context.Quotes
            .Include(q => q.Book)
            .Include(q => q.User)
            .Select(q => new 
            {
                q.Id,
                q.Text,
                q.Author,
                q.BookId,
                BookTitle = q.Book != null ? q.Book.Title : null,
                q.UserId,
                Username = q.User != null ? q.User.Username : null
            })
            .ToListAsync();

        return Ok(quotes);
    }

    // GET: api/admin/stats
    [HttpGet("stats")]
    public async Task<ActionResult<object>> GetStats()
    {
        var userCount = await _context.Users.CountAsync();
        var bookCount = await _context.Books.CountAsync();
        var quoteCount = await _context.Quotes.CountAsync();
        var adminCount = await _context.Users.CountAsync(u => u.Role == UserRole.Admin);

        return Ok(new
        {
            TotalUsers = userCount,
            TotalBooks = bookCount,
            TotalQuotes = quoteCount,
            AdminUsers = adminCount
        });
    }
}
