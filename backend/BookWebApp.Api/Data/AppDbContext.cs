using Microsoft.EntityFrameworkCore;
using BookWebApp.Api.Models;

namespace BookWebApp.Api.Data
{
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

            // Book -> Quote (one-to-many) - Make BookId optional
            modelBuilder.Entity<Book>()
                .HasMany(b => b.Quotes)
                .WithOne(q => q.Book)
                .HasForeignKey(q => q.BookId)
                .IsRequired(false)                   // Make the foreign key optional
                .OnDelete(DeleteBehavior.SetNull);   // Set BookId to null if Book is deleted

            // User -> Quote (one-to-many)
            modelBuilder.Entity<User>()
                .HasMany(u => u.Quotes)
                .WithOne(q => q.User)
                .HasForeignKey(q => q.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
