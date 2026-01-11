// BookWebApp.Api/Controllers/QuotesController.cs
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

    // PUBLIC: Get global quotes (the 5 default quotes)
    [HttpGet("global")]
    public async Task<IEnumerable<Quote>> GetGlobalQuotes()
    {
        return await _context.Quotes
            .Where(q => q.IsGlobal)
            .ToListAsync();
    }

    // PUBLIC: Get all quotes (global + user's own if logged in)
    [HttpGet]
    public async Task<IEnumerable<Quote>> GetAll()
    {
        var userId = GetCurrentUserId();
        var quotes = await _context.Quotes.ToListAsync();
        
        // Filter: global quotes + user's own quotes if logged in
        var result = quotes.Where(q => q.IsGlobal);
        
        if (userId.HasValue)
        {
            var userQuotes = quotes.Where(q => q.UserId == userId && !q.IsGlobal);
            result = result.Concat(userQuotes);
        }
        
        return result;
    }

    // GET: api/quotes/my (user's personal quotes - requires login)
    [Authorize]
    [HttpGet("my")]
    public async Task<IEnumerable<Quote>> GetMyQuotes()
    {
        var userId = GetCurrentUserId();
        if (userId == null) return new List<Quote>();
        
        return await _context.Quotes
            .Where(q => q.UserId == userId && !q.IsGlobal)
            .ToListAsync();
    }

    // CREATE user quote (requires login)
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

        // Set as user quote (not global)
        q.UserId = userId.Value;
        q.IsGlobal = false;
        
        // BookId is optional
        if (q.BookId <= 0) q.BookId = null;

        _context.Quotes.Add(q);
        await _context.SaveChangesAsync();

        return Ok(q);
    }

    // UPDATE user quote (requires login)
    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Quote updated)
    {
        var quote = await _context.Quotes.FindAsync(id);
        if (quote == null) return NotFound();

        // Check if it's a global quote (can't edit global quotes)
        if (quote.IsGlobal) return Forbid();

        var userId = GetCurrentUserId();
        if (!IsOwnerOrAdmin(quote.UserId, userId)) return Forbid();

        quote.Text = updated.Text;
        quote.Author = updated.Author;
        quote.BookId = updated.BookId <= 0 ? null : updated.BookId;

        await _context.SaveChangesAsync();
        return Ok(quote);
    }

    // DELETE user quote (requires login)
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var quote = await _context.Quotes.FindAsync(id);
        if (quote == null) return NotFound();

        // Check if it's a global quote (can't delete global quotes)
        if (quote.IsGlobal) return Forbid();

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