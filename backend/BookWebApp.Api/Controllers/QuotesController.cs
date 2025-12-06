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
    // optional query params:
    //   ?bookId=123  -> quotes for that book
    //   ?mine=true   -> quotes for current user
    [HttpGet]
    public async Task<IEnumerable<Quote>> GetAll([FromQuery] int? bookId, [FromQuery] bool? mine)
    {
        var query = _context.Quotes.AsQueryable();

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

    // GET single
    [HttpGet("{id}")]
    public async Task<ActionResult<Quote>> Get(int id)
    {
        var quote = await _context.Quotes.FindAsync(id);
        if (quote == null) return NotFound();
        return quote;
    }

    // POST: create; client should provide Text and BookId (UserId set from token)
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Quote q)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        // ensure Book exists
        var bookExists = await _context.Books.AnyAsync(b => b.Id == q.BookId);
        if (!bookExists) return BadRequest(new { message = "BookId references non-existent book" });

        q.UserId = userId.Value;
        _context.Quotes.Add(q);
        await _context.SaveChangesAsync();
        return Ok(q);
    }

    // PUT: update - only owner or admin
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Quote updated)
    {
        var quote = await _context.Quotes.FindAsync(id);
        if (quote == null) return NotFound();

        var userId = GetCurrentUserId();
        if (!IsOwnerOrAdmin(quote.UserId, userId)) return Forbid();

        // allow updating text and (optionally) BookId
        quote.Text = updated.Text;
        if (updated.BookId != 0 && updated.BookId != quote.BookId)
        {
            var bookExists = await _context.Books.AnyAsync(b => b.Id == updated.BookId);
            if (!bookExists) return BadRequest(new { message = "New BookId does not exist" });
            quote.BookId = updated.BookId;
        }

        await _context.SaveChangesAsync();
        return Ok(quote);
    }

    // DELETE - only owner or admin
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
        // admin?
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        if (role == "Admin") return true;
        return false;
    }
}
