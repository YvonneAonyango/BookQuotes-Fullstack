using BookWebApp.Api.Data;
using BookWebApp.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookWebApp.Api.Controllers;

[ApiController]
[Route("api/books")]
public class BooksController : ControllerBase
{
    private readonly AppDbContext _context;

    public BooksController(AppDbContext context) => _context = context;

    // ----------------- GET ALL BOOKS -----------------
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetBooks()
    {
        var books = await _context.Books
            .AsNoTracking()
            .ToListAsync();

        return Ok(books);
    }

    // ----------------- GET SINGLE BOOK -----------------
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBook(int id)
    {
        var book = await _context.Books
            .Include(b => b.Quotes)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id);

        if (book == null) return NotFound();
        return Ok(book);
    }

    // ----------------- CREATE BOOK -----------------
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Book book)
    {
        if (string.IsNullOrWhiteSpace(book.Title))
            return BadRequest(new { message = "Title is required" });
        if (string.IsNullOrWhiteSpace(book.Author))
            return BadRequest(new { message = "Author is required" });

        // ⚡ Convert PublishDate to UTC
        if (book.PublishDate.HasValue)
            book.PublishDate = DateTime.SpecifyKind(book.PublishDate.Value, DateTimeKind.Utc);

        _context.Books.Add(book);
        await _context.SaveChangesAsync();

        return Ok(book);
    }

    // ----------------- UPDATE BOOK -----------------
    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Book updated)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null) return NotFound();

        book.Title = updated.Title;
        book.Author = updated.Author;

        if (updated.PublishDate.HasValue)
            book.PublishDate = DateTime.SpecifyKind(updated.PublishDate.Value, DateTimeKind.Utc);

        await _context.SaveChangesAsync();
        return Ok(book);
    }

    // ----------------- DELETE BOOK -----------------
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null) return NotFound();

        _context.Books.Remove(book);
        await _context.SaveChangesAsync();
        return Ok();
    }
}
