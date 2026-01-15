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

    // ----------------- GET GLOBAL QUOTES -----------------
    [HttpGet("global")]
    [AllowAnonymous]
    public async Task<IActionResult> GetGlobalQuotes()
    {
        var quotes = await _context.Quotes
            .Where(q => q.IsGlobal)
            .AsNoTracking()
            .ToListAsync();

        return Ok(quotes);
    }

    // ----------------- GET MY QUOTES -----------------
    [Authorize]
    [HttpGet("my")]
    public async Task<IActionResult> GetMyQuotes()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var quotes = await _context.Quotes
            .Where(q => q.UserId == userId)
            .AsNoTracking()
            .ToListAsync();

        return Ok(quotes);
    }

    // ----------------- CREATE -----------------
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Quote q)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(q.Text))
            return BadRequest(new { message = "Text is required" });

        if (string.IsNullOrWhiteSpace(q.Author))
            return BadRequest(new { message = "Author is required" });

        q.UserId = userId.Value;
        q.IsGlobal = true; // all quotes by owner are global
        q.BookId = q.BookId > 0 ? q.BookId : null;

        _context.Quotes.Add(q);
        await _context.SaveChangesAsync();

        return Ok(q);
    }

    // ----------------- UPDATE -----------------
    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Quote updated)
    {
        var quote = await _context.Quotes.FindAsync(id);
        if (quote == null) return NotFound();

        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        if (quote.UserId != userId)
            return Forbid();

        quote.Text = updated.Text;
        quote.Author = updated.Author;
        quote.BookId = updated.BookId > 0 ? updated.BookId : null;

        await _context.SaveChangesAsync();
        return Ok(quote);
    }

    // ----------------- DELETE -----------------
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var quote = await _context.Quotes.FindAsync(id);
        if (quote == null) return NotFound();

        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        if (quote.UserId != userId)
            return Forbid();

        _context.Quotes.Remove(quote);
        await _context.SaveChangesAsync();
        return Ok();
    }

    // ----------------- HELPERS -----------------
    private int? GetUserId() =>
        int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
}

