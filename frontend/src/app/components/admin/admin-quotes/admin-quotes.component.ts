import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

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
    if (this.authService.isAdmin()) this.loadQuotes();
    else this.errorMessage = 'Admin access required.';
  }

  loadQuotes(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const token = this.authService.getToken();
    if (!token) { this.errorMessage = 'Not authenticated'; this.isLoading = false; return; }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // ✅ Corrected endpoint
    this.http.get<Quote[]>(`${environment.apiUrl}/admin/quotes`, { headers })
      .subscribe({
        next: (quotes) => { this.quotes = quotes; this.isLoading = false; },
        error: (error) => { console.error('Error loading quotes:', error); this.errorMessage = 'Failed to load quotes'; this.isLoading = false; }
      });
  }

  deleteQuote(id: number): void {
    if (!id) return;
    if (!confirm('Delete this quote?')) return;

    const token = this.authService.getToken();
    if (!token) return;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // ✅ Corrected endpoint
    this.http.delete<void>(`${environment.apiUrl}/admin/quotes/${id}`, { headers })
      .subscribe({
        next: () => this.quotes = this.quotes.filter(q => q.id !== id),
        error: (error) => console.error('Error deleting quote:', error)
      });
  }

  truncateText(text: string, maxLength: number = 100): string {
    return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
  }

  isAdminUser(): boolean {
    return this.authService.isAdmin();
  }
}
