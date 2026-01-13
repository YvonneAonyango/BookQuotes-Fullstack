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

    public QuotesController(AppDbContext context) => _context = context;

    // GET public global quotes (all users see them)
    [HttpGet("global")]
    public async Task<IActionResult> GetGlobalQuotes()
    {
        var quotes = await _context.Quotes
            .Where(q => q.IsGlobal)
            .AsNoTracking()
            .ToListAsync();
        return Ok(quotes);
    }

    // GET logged-in user's personal quotes (only for owner, optional)
    [Authorize]
    [HttpGet("my")]
    public async Task<IActionResult> GetMyQuotes()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var quotes = await _context.Quotes
            .Where(q => q.UserId == userId && q.IsGlobal) // Only your quotes, all marked global
            .AsNoTracking()
            .ToListAsync();

        return Ok(quotes);
    }

    // CREATE a quote (owner only)
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Quote q)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        if (string.IsNullOrWhiteSpace(q.Text)) return BadRequest(new { message = "Text is required" });
        if (string.IsNullOrWhiteSpace(q.Author)) return BadRequest(new { message = "Author is required" });

        q.UserId = userId.Value;
        q.IsGlobal = true; // all quotes created by owner are global
        q.BookId = q.BookId > 0 ? q.BookId : null;

        _context.Quotes.Add(q);
        await _context.SaveChangesAsync();
        return Ok(q);
    }

    // UPDATE a quote (owner only)
    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Quote updated)
    {
        var quote = await _context.Quotes.FindAsync(id);
        if (quote == null) return NotFound();

        var userId = GetUserId();
        if (quote.UserId != userId) return Forbid();

        quote.Text = updated.Text;
        quote.Author = updated.Author;
        quote.BookId = updated.BookId > 0 ? updated.BookId : null;

        await _context.SaveChangesAsync();
        return Ok(quote);
    }

    // DELETE a quote (owner only)
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var quote = await _context.Quotes.FindAsync(id);
        if (quote == null) return NotFound();

        var userId = GetUserId();
        if (quote.UserId != userId) return Forbid();

        _context.Quotes.Remove(quote);
        await _context.SaveChangesAsync();
        return Ok();
    }

    private int? GetUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(sub, out var id) ? id : null;
    }
}