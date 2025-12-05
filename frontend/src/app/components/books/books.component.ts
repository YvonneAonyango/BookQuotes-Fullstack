import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Book, BookService } from '../../services/book.service';
import { TranslationService } from '../../services/translation.service'; 
import { TranslationPipe } from '../../pipes/translation.pipe'; 
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-books',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    TranslationPipe 
  ],
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.css']
})
export class BooksComponent implements OnInit {
  books: Book[] = [];
  isLoading = false;
  hasMoreBooks = false;

  constructor(
    private bookService: BookService, 
    private router: Router,
    private translationService: TranslationService 
  ) {}

  ngOnInit(): void {
    this.loadBooks();
  }

  loadBooks(): void {
    this.isLoading = true;
    this.bookService.getBooks().subscribe({
      next: (books) => {
        this.books = books;
        this.isLoading = false;
        this.hasMoreBooks = books.length >= 10;
      },
      error: (error) => {
        console.error('Error loading books:', error);
        this.isLoading = false;
      }
    });
  }

  addBook(): void {
    this.router.navigate(['/books/new']);
  }

  editBook(id: number): void {
    this.router.navigate(['/books/edit', id]);
  }

  deleteBook(id: number): void {
    const confirmMessage = this.translationService.translate('confirmDeleteBook') || 
                          'Are you sure you want to delete this book?';
    
    if (confirm(confirmMessage)) {
      this.bookService.deleteBook(id).subscribe({
        next: () => {
          this.books = this.books.filter(book => book.id !== id);
        },
        error: (error) => {
          console.error('Error deleting book:', error);
        }
      });
    }
  }
}