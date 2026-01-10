using BookWebApp.Api.Data;
using BookWebApp.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BookWebApp.Api.Controllers;

[ApiController]
[Route("api/quotes")]
public class QuotesController : ControllerBase
{
    private readonly AppDbContext _context;

    public QuotesController(AppDbContext context)
    {
        _context = context;
    }

    // ✅ PUBLIC: Get standalone (global) quotes
    [HttpGet]
    public async Task<IEnumerable<Quote>> GetAll()
    {
        return await _context.Quotes
            .Include(q => q.Book)
            .Where(q => q.BookId == null)
            .ToListAsync();
    }

    // GET: api/quotes/5 (optional, still public)
    [HttpGet("{id}")]
    public async Task<ActionResult<Quote>> Get(int id)
    {
        var quote = await _context.Quotes
            .Include(q => q.Book)
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quote == null) return NotFound();
        return quote;
    }

    // 🔒 CREATE
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Quote q)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(q.Text))
            return BadRequest(new { message = "Text is required" });

        if (string.IsNullOrWhiteSpace(q.Author))
            return BadRequest(new { message = "Author is required" });

        q.BookId = null;
        q.UserId = userId.Value;

        _context.Quotes.Add(q);
        await _context.SaveChangesAsync();

        return Ok(q);
    }

    // 🔒 UPDATE
    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Quote updated)
    {
        var quote = await _context.Quotes.FindAsync(id);
        if (quote == null) return NotFound();

        var userId = GetCurrentUserId();
        if (!IsOwnerOrAdmin(quote.UserId, userId)) return Forbid();

        quote.Text = updated.Text;
        quote.Author = updated.Author;

        await _context.SaveChangesAsync();
        return Ok(quote);
    }

    // 🔒 DELETE
    [Authorize]
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

    // Helpers
    private int? GetCurrentUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(sub, out var id) ? id : null;
    }

    private bool IsOwnerOrAdmin(int resourceOwnerUserId, int? currentUserId)
    {
        if (currentUserId == null) return false;
        if (resourceOwnerUserId == currentUserId) return true;
        return User.FindFirst(ClaimTypes.Role)?.Value == "Admin";
    }
}
