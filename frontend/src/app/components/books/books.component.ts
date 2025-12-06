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
  addedBooks: Book[] = [];
  bookForm: FormGroup;

  isLoading = false;
  isEditing = false;

  editingBookId?: number;
  selectedBookId?: number;

  // NEW from your old component
  currentAction: 'add' | 'edit' | 'delete' | null = null;

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
    this.loadBasketFromStorage();
  }

  // -----------------------
  // LOAD BOOKS
  // -----------------------
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

  // -----------------------
  // MODE SWITCHING (NEW)
  // -----------------------
  showAddForm() {
    this.currentAction = 'add';
    this.resetForm();
    this.selectedBookId = undefined;
  }

  showEditMode() {
    this.currentAction = 'edit';
    this.selectedBookId = undefined;
    this.resetForm();
  }

  showDeleteMode() {
    this.currentAction = 'delete';
    this.selectedBookId = undefined;
  }

  cancelAction() {
    this.currentAction = null;
    this.selectedBookId = undefined;
    this.resetForm();
  }

  // -----------------------
  // SELECT BOOK FOR ACTION
  // -----------------------
  selectBookForAction(book: Book) {
    this.selectedBookId = book.id;

    if (this.currentAction === 'edit') {
      this.isEditing = true;
      this.editingBookId = book.id;

      this.bookForm.patchValue({
        title: book.title,
        author: book.author || ''
      });

      document.querySelector('.book-form-section')
        ?.scrollIntoView({ behavior: 'smooth' });
    }

    if (this.currentAction === 'delete') {
      // Now calls the updated deleteBook method
      this.deleteBook(book.id!);
    }
  }

  // -----------------------
  // BASKET
  // -----------------------
  addToBasket(book: Book): void {
    if (!this.isInBasket(book.id!)) {
      this.addedBooks.push(book);
      this.saveBasketToStorage();
    }
  }

  removeFromBasket(bookId: number): void {
    this.addedBooks = this.addedBooks.filter(book => book.id !== bookId);
    this.saveBasketToStorage();
  }

  isInBasket(bookId: number): boolean {
    return this.addedBooks.some(book => book.id === bookId);
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
        console.error('Error loading basket:', e);
      }
    }
  }

  // -----------------------
  // FORM SUBMIT
  // -----------------------
  onSubmit(): void {
    if (!this.bookForm.valid) return;

    this.isLoading = true;
    const data: Book = this.bookForm.value;

    if (this.isEditing && this.editingBookId) {
      this.updateBook(this.editingBookId, data);
    } else {
      this.createBook(data);
    }
  }

  // CREATE NEW BOOK
  createBook(bookData: Book) {
    this.bookService.createBook(bookData).subscribe({
      next: newBook => {
        this.books.push(newBook);
        this.addedBooks.push(newBook);
        this.saveBasketToStorage();
        this.resetForm();
        this.currentAction = null;
        this.isLoading = false;
      },
      error: err => {
        console.error('Error adding book:', err);
        this.isLoading = false;
      }
    });
  }

  // UPDATE BOOK
  updateBook(id: number, bookData: Book) {
    this.bookService.updateBook(id, bookData).subscribe({
      next: updated => {
        const idx = this.books.findIndex(b => b.id === id);
        if (idx !== -1) this.books[idx] = updated;

        const badgeIdx = this.addedBooks.findIndex(b => b.id === id);
        if (badgeIdx !== -1) this.addedBooks[badgeIdx] = updated;

        this.saveBasketToStorage();
        this.resetForm();
        this.currentAction = null;
        this.selectedBookId = undefined;
        this.isLoading = false;
      },
      error: err => {
        console.error('Error updating book:', err);
        this.isLoading = false;
      }
    });
  }

  // -----------------------
  // DELETE BOOK - UPDATED VERSION
  // -----------------------
  deleteBook(id: number): void {
    // If we're in delete mode and this book is selected, show confirmation
    if (this.currentAction === 'delete' && this.selectedBookId === id) {
      const msg =
        this.translationService.translate('confirmDeleteBook') ||
        'Are you sure you want to delete this book?';

      if (!confirm(msg)) return;

      this.bookService.deleteBook(id).subscribe({
        next: () => {
          this.books = this.books.filter(book => book.id !== id);
          this.addedBooks = this.addedBooks.filter(book => book.id !== id);
          
          this.cancelAction();
          this.saveBasketToStorage();
        },
        error: err => console.error('Error deleting book:', err)
      });
    }
    // If not in delete mode, just select the book for deletion
    else {
      this.showDeleteMode();
      this.selectedBookId = id;
    }
  }

  // -----------------------
  // RESET FORM
  // -----------------------
  resetForm(): void {
    this.bookForm.reset();
    this.isEditing = false;
    this.editingBookId = undefined;
  }

  cancelForm(): void {
    this.resetForm();
    this.currentAction = null;
    this.selectedBookId = undefined;
  }
}