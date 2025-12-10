import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Quote {
  id?: number;
  text: string;
  author: string;
  bookId?: number | null;
  userId?: number;
  book?: Book;
}

export interface Book {
  id: number;
  title: string;
  author: string;
}

@Injectable({
  providedIn: 'root'
})
export class QuoteService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  // Build headers with Authorization if token exists
  private getAuthHeaders(jsonContent: boolean = false): HttpHeaders {
    const token = this.auth.getToken();
    const headersConfig: { [key: string]: string } = {};
    if (token) {
      headersConfig['Authorization'] = `Bearer ${token}`;
    }
    if (jsonContent) headersConfig['Content-Type'] = 'application/json';
    return new HttpHeaders(headersConfig);
  }

  // ------------------------
  // QUOTES API
  // ------------------------
  // always call backend (do not early-return) — include credentials and headers
  getQuotes(): Observable<Quote[]> {
    return this.http.get<Quote[]>(`${this.apiUrl}/quotes?mine=true`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  getQuote(id: number): Observable<Quote> {
    return this.http.get<Quote>(`${this.apiUrl}/quotes/${id}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  createQuote(quote: Quote): Observable<Quote> {
    // Ensure user is logged in client-side — helpful UX check
    if (!this.auth.isAuthenticated()) {
      throw new Error('Not logged in');
    }

    const payload = {
      ...quote,
      userId: this.auth.getCurrentUserId(),
      bookId: quote.bookId || null
    };

    return this.http.post<Quote>(`${this.apiUrl}/quotes`, payload, {
      headers: this.getAuthHeaders(true),
      withCredentials: true
    });
  }

  updateQuote(id: number, quote: Quote): Observable<Quote> {
    const payload = {
      ...quote,
      userId: this.auth.getCurrentUserId(),
      bookId: quote.bookId || null
    };
    return this.http.put<Quote>(`${this.apiUrl}/quotes/${id}`, payload, {
      headers: this.getAuthHeaders(true),
      withCredentials: true
    });
  }

  deleteQuote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/quotes/${id}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  getQuotesByBookId(bookId: number): Observable<Quote[]> {
    return this.http.get<Quote[]>(`${this.apiUrl}/books/${bookId}/quotes`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }
}