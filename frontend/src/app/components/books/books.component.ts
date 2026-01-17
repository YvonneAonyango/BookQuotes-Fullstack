import { Component, OnInit, inject } from '@angular/core';
import { Book, BookService } from '../../services/book.service';
import { Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome'; // ✅ import module
import { faStar } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-books',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    FontAwesomeModule // ✅ add FontAwesomeModule here
  ],
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.css']
})
export class BooksComponent implements OnInit {
  books: (Book & { isFavorite: boolean })[] = [];
  isLoading = false;
  errorMessage = '';

  faStar = faStar;

  private meta = inject(Meta);
  private titleService = inject(Title);
  private bookService = inject(BookService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private auth = inject(AuthService);
  private library = inject(FaIconLibrary);

  constructor() {
    this.library.addIcons(faStar); // ✅ add icon to library
  }

  ngOnInit(): void {
    this.titleService.setTitle('BookWebApp - The Library');
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
        this.books = books.map(b => ({ ...b, isFavorite: false })); // initialize favorites
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = this.translate.instant('errorLoadingBook');
        this.isLoading = false;
      }
    });
  }

  toggleFavorite(book: Book & { isFavorite: boolean }): void {
    book.isFavorite = !book.isFavorite;
  }

  addBook(): void {
    if (!this.isLoggedIn()) this.router.navigate(['/login']);
    else this.router.navigate(['/books/new']);
  }

  editBook(book: Book): void {
    if (!this.isLoggedIn()) this.router.navigate(['/login']);
    else this.router.navigate(['/books/edit', book.id]);
  }

  deleteBook(book: Book): void {
    if (!this.isLoggedIn()) this.router.navigate(['/login']);
    else
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
