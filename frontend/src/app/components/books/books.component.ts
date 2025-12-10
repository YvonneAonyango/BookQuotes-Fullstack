import { Component, OnInit, inject } from '@angular/core';
import { Book, BookService } from '../../services/book.service';
import { Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { BookFormComponent } from '../book-form/book-form.component';
import { AuthService } from '../../services/auth.service'; // ADDED

@Component({
  selector: 'app-books',
  standalone: true,
  imports: [CommonModule, TranslateModule, BookFormComponent],
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.css']
})
export class BooksComponent implements OnInit {
  books: Book[] = [];
  isLoading = false;
  errorMessage = '';

  showFormModal = false;
  editingBook?: Book;
  isEditMode = false;

  private meta = inject(Meta);
  private titleService = inject(Title);
  private bookService = inject(BookService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private auth = inject(AuthService); // ADDED

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
      error: err => {
        console.error(err);
        this.errorMessage = this.translate.instant('failedLoadBooks') || 'Failed to load books.';
        this.isLoading = false;
      }
    });
  }

  openForm(book?: Book): void {
    this.isEditMode = !!book;
    if (book && (book as any).PublishDate && !book.publishDate) {
      book.publishDate = (book as any).PublishDate;
    }
    this.editingBook = book ? { ...book } : undefined;
    this.showFormModal = true;
  }

  closeForm(reload = false): void {
    this.showFormModal = false;
    this.editingBook = undefined;
    this.isEditMode = false;
    if (reload) this.loadBooks();
  }

  addBook(): void {
    if (!this.isLoggedIn()) {
      alert(this.translate.instant('loginRequired'));
      this.router.navigate(['/login']);
      return;
    }
    this.openForm();
  }

  editBook(id: number): void {
    const book = this.books.find(b => b.id === id);
    if (book) this.openForm(book);
  }

  deleteBook(id: number): void {
    this.translate.get('confirmDeleteBook').subscribe(msg => {
      if (confirm(msg)) {
        this.bookService.deleteBook(id).subscribe({
          next: () => this.books = this.books.filter(b => b.id !== id),
          error: err => alert(this.translate.instant('failedDeleteBook') || 'Failed to delete book.')
        });
      }
    });
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateString;
    }
  }

  private isLoggedIn(): boolean {
    return this.auth.isAuthenticated(); 
  }
}