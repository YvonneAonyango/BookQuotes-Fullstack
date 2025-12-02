using BookWebApp.Api.Data;
using BookWebApp.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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

    [HttpGet]
    public async Task<IEnumerable<Quote>> GetAll()
        => await _context.Quotes.ToListAsync();

    [HttpPost]
    public async Task<IActionResult> Create(Quote q)
    {
        _context.Quotes.Add(q);
        await _context.SaveChangesAsync();
        return Ok(q);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Quote updated)
    {
        var quote = await _context.Quotes.FindAsync(id);
        if (quote == null) return NotFound();

        quote.Text = updated.Text;

        await _context.SaveChangesAsync();
        return Ok(quote);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var quote = await _context.Quotes.FindAsync(id);
        if (quote == null) return NotFound();

        _context.Quotes.Remove(quote);
        await _context.SaveChangesAsync();

        return Ok();
    }
}