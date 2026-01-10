import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

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
    if (this.authService.isAdmin()) this.loadBooks();
    else this.errorMessage = 'Admin access required.';
  }

  loadBooks(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const token = this.authService.getToken();
    if (!token) { this.errorMessage = 'Not authenticated'; this.isLoading = false; return; }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    
    this.http.get<Book[]>(`${environment.apiUrl}/admin/books`, { headers })
      .subscribe({
        next: (books) => { this.books = books; this.isLoading = false; },
        error: (error) => { console.error('Error loading books:', error); this.errorMessage = 'Failed to load books'; this.isLoading = false; }
      });
  }

  editBook(id: number): void {
    this.router.navigate(['/books/edit', id]);
  }

  deleteBook(id: number): void {
    if (!id) return;
    if (!confirm('Delete this book and all its quotes?')) return;

    const token = this.authService.getToken();
    if (!token) return;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    
    this.http.delete<void>(`${environment.apiUrl}/admin/books/${id}`, { headers })
      .subscribe({
        next: () => this.books = this.books.filter(b => b.id !== id),
        error: (error) => console.error('Error deleting book:', error)
      });
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'Invalid Date';
    }
  }

  isAdminUser(): boolean {
    return this.authService.isAdmin();
  }
}