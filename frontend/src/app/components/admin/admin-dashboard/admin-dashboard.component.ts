import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';
import { environment } from '../../../../environments/environment';

export interface Stats {
  totalUsers: number;
  totalBooks: number;
  totalQuotes: number;
  adminUsers: number;
}

export interface User {
  id: number;
  username: string;
  role: string;
  registeredDate?: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
}

export interface Quote {
  id: number;
  text: string;
  author: string;
  bookId?: number;
  bookTitle?: string;
  userId: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  stats = signal<Stats>({ totalUsers: 0, totalBooks: 0, totalQuotes: 0, adminUsers: 0 });
  users = signal<User[]>([]);
  books = signal<Book[]>([]);
  quotes = signal<Quote[]>([]);

  isLoading = signal(false);
  errorMessage = signal('');
  isDarkMode = computed(() => this.themeService.isDarkMode());

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAdmin()) {
      this.errorMessage.set('Admin access required. Please login as admin.');
      return;
    }

    this.loadDashboard();
  }

  // --------------------------
  // Load all dashboard data concurrently
  // --------------------------
  loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      stats: this.authService.adminGet<any>('stats').pipe(
        catchError(err => {
          console.error('Error loading stats:', err);
          this.errorMessage.set('Failed to load stats');
          return of(null);
        })
      ),
      users: this.authService.adminGet<any[]>('users').pipe(
        catchError(err => {
          console.error('Error loading users:', err);
          this.errorMessage.set('Failed to load users');
          return of([]);
        })
      ),
      books: this.authService.adminGet<any[]>('books').pipe(
        catchError(err => {
          console.error('Error loading books:', err);
          this.errorMessage.set('Failed to load books');
          return of([]);
        })
      ),
      quotes: this.authService.adminGet<any[]>('quotes').pipe(
        catchError(err => {
          console.error('Error loading quotes:', err);
          this.errorMessage.set('Failed to load quotes');
          return of([]);
        })
      )
    }).subscribe({
      next: ({ stats, users, books, quotes }) => {
        if (stats) {
          this.stats.set({
            totalUsers: stats.TotalUsers ?? 0,
            totalBooks: stats.TotalBooks ?? 0,
            totalQuotes: stats.TotalQuotes ?? 0,
            adminUsers: stats.AdminUsers ?? 0
          });
        }

        this.users.set(users.map(u => ({
          id: u.id,
          username: u.username,
          role: u.Role ?? u.role,
          registeredDate: u.RegisteredDate ?? u.registeredDate
        })));

        this.books.set(books.map(b => ({
          id: b.id,
          title: b.title,
          author: b.author
        })));

        const booksMap = new Map(this.books().map(b => [b.id, b.title]));
        this.quotes.set(quotes.map(q => ({
          id: q.id,
          text: q.Text ?? q.text,
          author: q.Author ?? q.author,
          bookId: q.BookId ?? q.bookId,
          bookTitle: q.BookId ? booksMap.get(q.BookId ?? q.bookId) : '',
          userId: q.UserId ?? q.userId
        })));
      },
      complete: () => this.isLoading.set(false)
    });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  isAdminUser(): boolean {
    return this.authService.isAdmin();
  }
}