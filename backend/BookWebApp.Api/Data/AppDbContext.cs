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

            // Book -> Quote (one-to-many)
            modelBuilder.Entity<Book>()
                .HasMany(b => b.Quotes)
                .WithOne(q => q.Book)
                .HasForeignKey(q => q.BookId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);

            // User -> Quote (one-to-many)
            modelBuilder.Entity<User>()
                .HasMany(u => u.Quotes)
                .WithOne(q => q.User)
                .HasForeignKey(q => q.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Seed System User (used for global quotes)
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    Id = 999,
                    Username = "System",
                    PasswordHash = Array.Empty<byte>(),
                    PasswordSalt = Array.Empty<byte>(),
                    Role = UserRole.Admin
                }
            );

            // Seed Global Quotes
            modelBuilder.Entity<Quote>().HasData(
                new Quote
                {
                    Id = 1001,
                    Text = "Be the change you wish to see in the world.",
                    Author = "Mahatma Gandhi",
                    UserId = 999,
                    IsGlobal = true,
                    BookId = null
                },
                new Quote
                {
                    Id = 1002,
                    Text = "The only thing that you absolutely have to know, is the location of the library.",
                    Author = "Albert Einstein",
                    UserId = 999,
                    IsGlobal = true,
                    BookId = null
                },
                new Quote
                {
                    Id = 1003,
                    Text = "A reader lives a thousand lives before he dies… The man who never reads lives only one.",
                    Author = "George R.R. Martin",
                    UserId = 999,
                    IsGlobal = true,
                    BookId = null
                },
                new Quote
                {
                    Id = 1004,
                    Text = "Tomorrow's success is determined by an accumulation of current efforts",
                    Author = "Yvonne",
                    UserId = 999,
                    IsGlobal = true,
                    BookId = null
                },
                new Quote
                {
                    Id = 1005,
                    Text = "It is during our darkest moments that we must focus to see the light.",
                    Author = "Aristotle",
                    UserId = 999,
                    IsGlobal = true,
                    BookId = null
                }
            );
        }
    }
}
