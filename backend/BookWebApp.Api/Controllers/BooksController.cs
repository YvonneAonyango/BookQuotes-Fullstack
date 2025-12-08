using BookWebApp.Api.Data;
using BookWebApp.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BookWebApp.Api.Controllers;

[ApiController]
[Route("api/books")]
public class BooksController : ControllerBase
{
    private readonly AppDbContext _context;

    public BooksController(AppDbContext context) => _context = context;

    // GET: api/books
    [HttpGet]
    [Authorize]
    public async Task<IEnumerable<Book>> GetAll()
    {
        var userId = GetUserId();

        if (IsAdmin())
            return await _context.Books.Include(b => b.Quotes).ToListAsync();

        return await _context.Books
            .Where(b => b.UserId == userId)
            .Include(b => b.Quotes)
            .ToListAsync();
    }

    // GET: api/books/5
    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<Book>> Get(int id)
    {
        var book = await _context.Books.Include(b => b.Quotes).FirstOrDefaultAsync(b => b.Id == id);
        if (book == null) return NotFound();

        if (!IsAdmin() && book.UserId != GetUserId())
            return Forbid();

        return Ok(book);
    }

    // POST: api/books
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create(Book book)
    {
        book.UserId = GetUserId();
        _context.Books.Add(book);
        await _context.SaveChangesAsync();
        return Ok(book);
    }

    // PUT: api/books/5
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, Book updated)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null) return NotFound();

        if (!IsAdmin() && book.UserId != GetUserId())
            return Forbid();

        book.Title = updated.Title;
        book.Author = updated.Author;
        book.PublishDate = updated.PublishDate;

        await _context.SaveChangesAsync();
        return Ok(book);
    }

    // DELETE: api/books/5
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null) return NotFound();

        if (!IsAdmin() && book.UserId != GetUserId())
            return Forbid();

        _context.Books.Remove(book);
        await _context.SaveChangesAsync();
        return Ok();
    }

    // Helpers
    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    private bool IsAdmin() =>
        User.IsInRole("Admin");
}