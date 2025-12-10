using BookWebApp.Api.Data;
using BookWebApp.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BookWebApp.Api.Controllers;

[ApiController]
[Route("api/quotes")]
[Authorize]
public class QuotesController : ControllerBase
{
    private readonly AppDbContext _context;

    public QuotesController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/quotes
    [HttpGet]
    public async Task<IEnumerable<Quote>> GetAll([FromQuery] int? bookId, [FromQuery] bool? mine)
    {
        var query = _context.Quotes.Include(q => q.Book).AsQueryable();

        if (bookId.HasValue)
            query = query.Where(q => q.BookId == bookId.Value);

        if (mine == true)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Enumerable.Empty<Quote>();
            query = query.Where(q => q.UserId == userId.Value);
        }

        return await query.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Quote>> Get(int id)
    {
        var quote = await _context.Quotes.Include(q => q.Book).FirstOrDefaultAsync(q => q.Id == id);
        if (quote == null) return NotFound();
        return quote;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Quote q)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(q.Text))
            return BadRequest(new { message = "Text is required" });

        if (string.IsNullOrWhiteSpace(q.Author))
            return BadRequest(new { message = "Author is required" });

        // Handle BookId: only assign if >0 and exists
        if (q.BookId.HasValue && q.BookId.Value > 0)
        {
            var bookExists = await _context.Books.AnyAsync(b => b.Id == q.BookId.Value);
            if (!bookExists) return BadRequest(new { message = "BookId references non-existent book" });
        }
        else
        {
            q.BookId = null;
        }

        q.UserId = userId.Value;
        _context.Quotes.Add(q);
        await _context.SaveChangesAsync();

        // Load Book for response
        await _context.Entry(q).Reference(q => q.Book).LoadAsync();
        return Ok(q);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Quote updated)
    {
        var quote = await _context.Quotes.FindAsync(id);
        if (quote == null) return NotFound();

        var userId = GetCurrentUserId();
        if (!IsOwnerOrAdmin(quote.UserId, userId)) return Forbid();

        if (string.IsNullOrWhiteSpace(updated.Text))
            return BadRequest(new { message = "Text is required" });

        if (string.IsNullOrWhiteSpace(updated.Author))
            return BadRequest(new { message = "Author is required" });

        quote.Text = updated.Text;
        quote.Author = updated.Author;

        // Handle BookId update
        if (updated.BookId.HasValue && updated.BookId.Value > 0)
        {
            if (updated.BookId.Value != quote.BookId)
            {
                var bookExists = await _context.Books.AnyAsync(b => b.Id == updated.BookId.Value);
                if (!bookExists) return BadRequest(new { message = "New BookId does not exist" });
                quote.BookId = updated.BookId.Value;
            }
        }
        else
        {
            quote.BookId = null;
        }

        await _context.SaveChangesAsync();

        await _context.Entry(quote).Reference(q => q.Book).LoadAsync();
        return Ok(quote);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var quote = await _context.Quotes.FindAsync(id);
        if (quote == null) return NotFound();

        var userId = GetCurrentUserId();
        if (!IsOwnerOrAdmin(quote.UserId, userId)) return Forbid();

        _context.Quotes.Remove(quote);
        await _context.SaveChangesAsync();
        return Ok();
    }

    // ---- Helpers ----
    private int? GetCurrentUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(sub, out var id)) return id;
        return null;
    }

    private bool IsOwnerOrAdmin(int resourceOwnerUserId, int? currentUserId)
    {
        if (currentUserId == null) return false;
        if (resourceOwnerUserId == currentUserId) return true;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        if (role == "Admin") return true;
        return false;
    }
}