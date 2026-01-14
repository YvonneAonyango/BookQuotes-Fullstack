using BookWebApp.Api.Data;
using BookWebApp.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BookWebApp.Api.Controllers;

[ApiController]
[Route("api/books")]
[Authorize]
public class BooksController : ControllerBase
{
    private readonly AppDbContext _context;

    public BooksController(AppDbContext context) => _context = context;

    // ----------------- DTO -----------------
    public class BookDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string Author { get; set; } = "";
        public DateTime? PublishDate { get; set; }
        public bool IsOwner { get; set; } // computed property
    }

    // ----------------- GET ALL BOOKS -----------------
    [HttpGet]
    [AllowAnonymous] // Everyone can see books
    public async Task<IEnumerable<BookDto>> GetAll()
    {
        var userId = GetUserId() ?? 0;

        var books = await _context.Books.AsNoTracking().ToListAsync();

        return books.Select(b => new BookDto
        {
            Id = b.Id,
            Title = b.Title,
            Author = b.Author,
            PublishDate = b.PublishDate,
            IsOwner = b.UserId == userId || IsAdmin()
        });
    }

    // ----------------- GET SINGLE BOOK -----------------
    [HttpGet("{id}")]
    [AllowAnonymous] 
    public async Task<ActionResult<BookDto>> Get(int id)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null) return NotFound();

        var userId = GetUserId() ?? 0;

        return new BookDto
        {
            Id = book.Id,
            Title = book.Title,
            Author = book.Author,
            PublishDate = book.PublishDate,
            IsOwner = book.UserId == userId || IsAdmin()
        };
    }

    // ----------------- CREATE -----------------
    [HttpPost]
    public async Task<IActionResult> Create(Book book)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        book.UserId = userId.Value;
        _context.Books.Add(book);
        await _context.SaveChangesAsync();

        return Ok(new BookDto
        {
            Id = book.Id,
            Title = book.Title,
            Author = book.Author,
            PublishDate = book.PublishDate,
            IsOwner = true
        });
    }

    // ----------------- UPDATE -----------------
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Book updated)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null) return NotFound();

        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        if (!IsAdmin() && book.UserId != userId)
            return Forbid();

        book.Title = updated.Title;
        book.Author = updated.Author;
        book.PublishDate = updated.PublishDate;

        await _context.SaveChangesAsync();

        return Ok(new BookDto
        {
            Id = book.Id,
            Title = book.Title,
            Author = book.Author,
            PublishDate = book.PublishDate,
            IsOwner = true
        });
    }

    // ----------------- DELETE -----------------
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null) return NotFound();

        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        if (!IsAdmin() && book.UserId != userId)
            return Forbid();

        _context.Books.Remove(book);
        await _context.SaveChangesAsync();
        return Ok();
    }

    // ----------------- HELPERS -----------------
    private int? GetUserId() =>
        int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    private bool IsAdmin() =>
        User.IsInRole("Admin");
}
