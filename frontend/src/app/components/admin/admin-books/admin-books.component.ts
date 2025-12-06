import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment'; // use environment

// Define Book interface
export interface Book {
  id: number;
  title: string;
  author: string;
  publishDate: string;
}

@Component({
  selector: 'app-admin-books',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-books.component.html',
  styleUrls: ['./admin-books.component.css']
})
export class AdminBooksComponent implements OnInit {
  books: Book[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isAdmin()) {
      this.loadBooks();
    } else {
      this.errorMessage = 'Admin access required. Please login as admin.';
    }
  }

  loadBooks(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const token = this.authService.getToken();
    if (!token) {
      this.errorMessage = 'Not authenticated. Please login.';
      this.isLoading = false;
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.get<Book[]>(`${environment.apiUrl}/api/admin/books`, { headers })
      .subscribe({
        next: (books) => {
          this.books = books;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading books:', error);
          this.errorMessage = error.error?.message || 'Failed to load books';
          this.isLoading = false;
        }
      });
  }

  editBook(id: number): void {
    this.router.navigate(['/books/edit', id]);
  }

  deleteBook(id: number): void {
    if (!id) {
      this.errorMessage = 'Invalid book ID';
      return;
    }

    if (confirm('Are you sure you want to delete this book? All associated quotes will also be deleted.')) {
      const token = this.authService.getToken();
      if (!token) {
        this.errorMessage = 'Not authenticated. Please login.';
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      this.http.delete<void>(`${environment.apiUrl}/api/admin/books/${id}`, { headers })
        .subscribe({
          next: () => {
            this.books = this.books.filter(book => book.id !== id);
          },
          error: (error) => {
            console.error('Error deleting book:', error);
            this.errorMessage = error.error?.message || 'Failed to delete book';
          }
        });
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  }

  isAdminUser(): boolean {
    return this.authService.isAdmin();
  }
}