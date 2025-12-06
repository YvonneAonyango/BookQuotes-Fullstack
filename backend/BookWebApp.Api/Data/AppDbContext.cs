using Microsoft.EntityFrameworkCore;
using BookWebApp.Api.Models;

namespace BookWebApp.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Book> Books => Set<Book>();
    public DbSet<Quote> Quotes => Set<Quote>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Book -> Quote (one-to-many)
        modelBuilder.Entity<Book>()
            .HasMany(b => b != null ? b.Quotes : null) // safe navigation; EF will ignore null in compile-time model
            .WithOne(q => q.Book)
            .HasForeignKey(q => q.BookId)
            .OnDelete(DeleteBehavior.Cascade);

        // User -> Quote (one-to-many)
        modelBuilder.Entity<User>()
            .HasMany(u => u != null ? u.Quotes : null)
            .WithOne(q => q.User)
            .HasForeignKey(q => q.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // NOTE: you may seed data using migrations or an administrative endpoint.
    }
}
