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

        // initial admin user (credentials can change)
        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = 1,
                Username = "admin",
                PasswordHash = new byte[64], //  actual hash needed
                PasswordSalt = new byte[128], //  actual salt needed
                Role = UserRole.Admin
            }
        );
    }
}