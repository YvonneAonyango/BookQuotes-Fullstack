import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Book, BookService } from '../../services/book.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-books',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.css']
})
export class BooksComponent implements OnInit {
  books: Book[] = [];
  isLoading = false;
  errorMessage: string = '';

  private meta = inject(Meta);
  private titleService = inject(Title);
  private bookService = inject(BookService);
  private router = inject(Router);
  private translate = inject(TranslateService);

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
    this.errorMessage = '';
    
    this.bookService.getBooks().subscribe({
      next: books => {
        this.books = books;
        this.isLoading = false;
      },
      error: error => {
        console.error('Error loading books:', error);
        this.errorMessage = 'Failed to load books. Please try again.';
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
    this.translate.get('confirmDeleteBook').subscribe((translated: string) => {
      if (confirm(translated)) {
        this.bookService.deleteBook(bookId).subscribe({
          next: () => {
            this.books = this.books.filter(book => book.id !== bookId);
          },
          error: err => {
            console.error('Error deleting book:', err);
            alert('Failed to delete book. Please try again.');
          }
        });
      }
    });
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }
}