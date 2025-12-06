import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
  imports: [CommonModule, RouterModule, TranslationPipe, ReactiveFormsModule],
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.css']
})
export class BooksComponent implements OnInit {
  books: Book[] = [];
  addedBooks: Book[] = []; // Books in the basket/badge system
  bookForm: FormGroup;
  isLoading = false;
  isEditing = false;
  editingBookId?: number;
  selectedBookId?: number; // For badge selection

  private meta = inject(Meta);
  private titleService = inject(Title);
  private translationService = inject(TranslationService);

  constructor(
    private bookService: BookService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.bookForm = this.fb.group({
      title: ['', [Validators.required]],
      author: ['']
    });
  }

  ngOnInit(): void {
    this.titleService.setTitle('BookWebApp - Books');
    
    this.meta.updateTag({
      name: 'description',
      content: 'Browse, manage, and edit your books in your personal library with BookWebApp.'
    });

    this.loadBooks();
    // Load any existing books from localStorage (for persistence)
    this.loadBasketFromStorage();
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

  // BADGE/BASKET SYSTEM METHODS
  addToBasket(book: Book): void {
    if (!this.isInBasket(book.id!)) {
      this.addedBooks.push(book);
      this.saveBasketToStorage();
    }
  }

  removeFromBasket(bookId: number): void {
    this.addedBooks = this.addedBooks.filter(book => book.id !== bookId);
    this.saveBasketToStorage();
    if (this.selectedBookId === bookId) {
      this.selectedBookId = undefined;
    }
  }

  isInBasket(bookId: number): boolean {
    return this.addedBooks.some(book => book.id === bookId);
  }

  editBookFromBadge(book: Book): void {
    this.selectedBookId = book.id;
    this.isEditing = true;
    this.editingBookId = book.id;
    this.bookForm.patchValue({
      title: book.title,
      author: book.author || ''
    });
    // Scroll to form
    document.querySelector('.book-form-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  saveBasketToStorage(): void {
    localStorage.setItem('bookBasket', JSON.stringify(this.addedBooks));
  }

  loadBasketFromStorage(): void {
    const saved = localStorage.getItem('bookBasket');
    if (saved) {
      try {
        this.addedBooks = JSON.parse(saved);
      } catch (e) {
        console.error('Error loading basket from storage:', e);
      }
    }
  }

  // FORM METHODS
  onSubmit(): void {
    if (this.bookForm.valid) {
      this.isLoading = true;
      const bookData: Book = this.bookForm.value;

      if (this.isEditing && this.editingBookId) {
        // Update existing book
        this.bookService.updateBook(this.editingBookId, bookData).subscribe({
          next: (updatedBook) => {
            // Update in main list
            const index = this.books.findIndex(b => b.id === this.editingBookId);
            if (index !== -1) this.books[index] = updatedBook;
            
            // Update in basket if present
            const basketIndex = this.addedBooks.findIndex(b => b.id === this.editingBookId);
            if (basketIndex !== -1) this.addedBooks[basketIndex] = updatedBook;
            
            this.resetForm();
            this.saveBasketToStorage();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error updating book:', error);
            this.isLoading = false;
          }
        });
      } else {
        // Add new book
        this.bookService.createBook(bookData).subscribe({
          next: (newBook) => {
            this.books.push(newBook);
            this.addedBooks.push(newBook); // Add to basket
            this.resetForm();
            this.saveBasketToStorage();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error adding book:', error);
            this.isLoading = false;
          }
        });
      }
    }
  }

  resetForm(): void {
    this.bookForm.reset();
    this.isEditing = false;
    this.editingBookId = undefined;
    this.selectedBookId = undefined;
  }

  cancelForm(): void {
    this.resetForm();
  }

  // EXISTING METHODS (modified)
  editBook(book: Book): void {
    this.editBookFromBadge(book);
  }

  deleteBook(id: number): void {
    const confirmMessage = this.translationService.translate('confirmDeleteBook') ||
      'Are you sure you want to delete this book?';

    if (confirm(confirmMessage)) {
      this.bookService.deleteBook(id).subscribe({
        next: () => {
          this.books = this.books.filter(book => book.id !== id);
          this.addedBooks = this.addedBooks.filter(book => book.id !== id);
          this.saveBasketToStorage();
          if (this.selectedBookId === id) {
            this.resetForm();
          }
        },
        error: error => console.error('Error deleting book:', error)
      });
    }
  }
}