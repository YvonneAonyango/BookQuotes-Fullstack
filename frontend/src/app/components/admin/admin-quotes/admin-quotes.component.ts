import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment'; // use environment

// Define Quote interface
export interface Quote {
  id?: number;
  text: string;
  author: string;
}

@Component({
  selector: 'app-admin-quotes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-quotes.component.html',
  styleUrls: ['./admin-quotes.component.css']
})
export class AdminQuotesComponent implements OnInit {
  quotes: Quote[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.authService.isAdmin()) {
      this.loadQuotes();
    } else {
      this.errorMessage = 'Admin access required. Please login as admin.';
    }
  }

  loadQuotes(): void {
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

    this.http.get<Quote[]>(`${environment.apiUrl}/api/admin/quotes`, { headers })
      .subscribe({
        next: (quotes) => {
          this.quotes = quotes;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading quotes:', error);
          this.errorMessage = error.error?.message || 'Failed to load quotes';
          this.isLoading = false;
        }
      });
  }

  deleteQuote(id: number): void {
    if (!id) {
      this.errorMessage = 'Invalid quote ID';
      return;
    }

    if (confirm('Are you sure you want to delete this quote?')) {
      const token = this.authService.getToken();
      if (!token) {
        this.errorMessage = 'Not authenticated. Please login.';
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      this.http.delete<void>(`${environment.apiUrl}/api/admin/quotes/${id}`, { headers })
        .subscribe({
          next: () => {
            this.quotes = this.quotes.filter(quote => quote.id !== id);
          },
          error: (error) => {
            console.error('Error deleting quote:', error);
            this.errorMessage = error.error?.message || 'Failed to delete quote';
          }
        });
    }
  }

  truncateText(text: string, maxLength: number = 100): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  isAdminUser(): boolean {
    return this.authService.isAdmin();
  }
}