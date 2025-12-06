import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Book, BookService } from '../../services/book.service';
import { TranslationService } from '../../services/translation.service';
import { TranslationPipe } from '../../pipes/translation.pipe';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-books',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslationPipe],
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.css']
})
export class BooksComponent implements OnInit {
  books: Book[] = [];
  isLoading = false;

  private meta = inject(Meta);
  private titleService = inject(Title);
  private bookService = inject(BookService);
  private router = inject(Router);

  ngOnInit(): void {
    this.titleService.setTitle('BookWebApp - Books');
    this.meta.updateTag({
      name: 'description',
      content: 'Browse and manage your books in your personal library with BookWebApp.'
    });

    this.loadBooks();
  }

  loadBooks(): void {
    this.isLoading = true;
    this.bookService.getBooks().subscribe({
      next: books => {
        this.books = books;
        this.isLoading = false;
      },
      error: error => {
        console.error('Error loading books:', error);
        this.isLoading = false;
      }
    });
  }

  addBook(): void {
    this.router.navigate(['/books/new']);
  }

  editBook(bookId: number): void {
    this.router.navigate(['/books/edit', bookId]);
  }

  deleteBook(bookId: number): void {
    const msg = 'Are you sure you want to delete this book?';
    
    if (confirm(msg)) {
      this.bookService.deleteBook(bookId).subscribe({
        next: () => {
          this.books = this.books.filter(book => book.id !== bookId);
        },
        error: err => console.error('Error deleting book:', err)
      });
    }
  }
}