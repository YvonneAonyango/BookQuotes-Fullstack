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

    public BooksController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/books
    [HttpGet]
    public async Task<IEnumerable<Book>> GetAll()
    {
        // Returning all books WITHOUT their quotes to avoid heavy payloads.
        return await _context.Books.ToListAsync();
    }

    // GET: api/books/5  (includes quotes)
    [HttpGet("{id}")]
    public async Task<ActionResult<Book>> Get(int id)
    {
        var book = await _context.Books
            .Include(b => b.Quotes)   // <-- Important: include quotes
            .FirstOrDefaultAsync(b => b.Id == id);

        if (book == null) return NotFound();

        return Ok(book);
    }

    // GET: api/books/5/quotes
    [HttpGet("{id}/quotes")]
    public async Task<IEnumerable<Quote>> GetQuotesForBook(int id)
    {
        return await _context.Quotes
            .Where(q => q.BookId == id)
            .ToListAsync();
    }

    // POST: api/books
    [HttpPost]
    [Authorize] // user must be logged in
    public async Task<IActionResult> Create(Book book)
    {
        _context.Books.Add(book);
        await _context.SaveChangesAsync();
        return Ok(book);
    }

    // PUT: api/books/5
    [HttpPut("{id}")]
    [Authorize] // user must be logged in
    public async Task<IActionResult> Update(int id, Book updated)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null) return NotFound();

        book.Title = updated.Title;
        book.Author = updated.Author;
        book.PublishDate = updated.PublishDate;

        await _context.SaveChangesAsync();
        return Ok(book);
    }

    // DELETE: api/books/5
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")] // only admin can delete books
    public async Task<IActionResult> Delete(int id)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null) return NotFound();

        _context.Books.Remove(book);
        await _context.SaveChangesAsync();
        return Ok();
    }
}
