import { Component, OnInit, inject } from '@angular/core';
import { Book, BookService } from '../../services/book.service';
import { Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-books',
  standalone: true,
  imports: [CommonModule, TranslateModule], // <- TranslateModule added
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.css']
})
export class BooksComponent implements OnInit {
  books: Book[] = [];
  isLoading = false;
  errorMessage = '';

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

  addBook(): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.router.navigate(['/books/new']);
  }

  editBook(book: Book): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.router.navigate(['/books/edit', book.id]);
  }

  deleteBook(book: Book): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.translate.get('confirmDeleteBook').subscribe(msg => {
      if (confirm(msg)) {
        this.bookService.deleteBook(book.id!).subscribe({
          next: () => {
            this.books = this.books.filter(b => b.id !== book.id);
          },
          error: () => {
            alert(this.translate.instant('errorDeleteBook'));
          }
        });
      }
    });
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  }

  isLoggedIn(): boolean {
    return this.auth.isAuthenticated();
  }
}