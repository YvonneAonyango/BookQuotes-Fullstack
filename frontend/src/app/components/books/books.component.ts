import { Component, OnInit, inject } from '@angular/core';
import { Book, BookService } from '../../services/book.service';
import { Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { BookFormComponent } from '../book-form/book-form.component';
import { AuthService } from '../../services/auth.service';

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
  private auth = inject(AuthService);

  ngOnInit(): void {
    this.titleService.setTitle('BookWebApp - Books');
    this.meta.updateTag({
      name: 'description',
      content: 'Browse books freely. Login to manage your collection.'
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
      error: () => {
        this.errorMessage = this.translate.instant('failedLoadBooks');
        this.isLoading = false;
      }
    });
  }

  // Only logged in users can add
  addBook(): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.openForm();
  }

  editBook(id: number): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    const book = this.books.find(b => b.id === id);
    if (book) this.openForm(book);
  }

  deleteBook(id: number): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.translate.get('confirmDeleteBook').subscribe(msg => {
      if (confirm(msg)) {
        this.bookService.deleteBook(id).subscribe(() => {
          this.books = this.books.filter(b => b.id !== id);
        });
      }
    });
  }

  openForm(book?: Book): void {
    this.isEditMode = !!book;
    this.editingBook = book ? { ...book } : undefined;
    this.showFormModal = true;
  }

  closeForm(reload = false): void {
    this.showFormModal = false;
    this.editingBook = undefined;
    this.isEditMode = false;
    if (reload) this.loadBooks();
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  }

  isLoggedIn(): boolean {
    return this.auth.isAuthenticated();
  }
}