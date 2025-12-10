import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
  // Generic admin GET helper
  // --------------------------
  private adminGet<T>(endpoint: string) {
    const token = this.authService.getToken();
    if (!token) throw new Error('Not authenticated. Please login.');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<T>(`${environment.apiUrl}/admin/${endpoint}`, { headers });
  }

  // --------------------------
  // Load all dashboard data
  // --------------------------
  loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    // Load Stats
    this.adminGet<any>('stats').subscribe({
      next: stats => {
        this.stats.set({
          totalUsers: stats.TotalUsers ?? 0,
          totalBooks: stats.TotalBooks ?? 0,
          totalQuotes: stats.TotalQuotes ?? 0,
          adminUsers: stats.AdminUsers ?? 0
        });
      },
      error: err => {
        console.error('Error loading stats:', err);
        this.errorMessage.set('Failed to load stats');
      }
    });

    // Load Users
    this.adminGet<any[]>('users').subscribe({
      next: users => this.users.set(users.map(u => ({
        id: u.id,
        username: u.username,
        role: u.Role ?? u.role,
        registeredDate: u.RegisteredDate ?? u.registeredDate
      }))),
      error: err => {
        console.error('Error loading users:', err);
        this.errorMessage.set('Failed to load users');
      }
    });

    // Load Books
    this.adminGet<any[]>('books').subscribe({
      next: books => this.books.set(books.map(b => ({
        id: b.id,
        title: b.title,
        author: b.author
      }))),
      error: err => {
        console.error('Error loading books:', err);
        this.errorMessage.set('Failed to load books');
      }
    });

    // Load Quotes
    this.adminGet<any[]>('quotes').subscribe({
      next: quotes => {
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
      error: err => {
        console.error('Error loading quotes:', err);
        this.errorMessage.set('Failed to load quotes');
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