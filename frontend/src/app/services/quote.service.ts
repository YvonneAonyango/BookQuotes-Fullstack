import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
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

  // ------------------------
  // AUTH HEADERS
  // ------------------------
  private getAuthHeaders(jsonContent: boolean = false): HttpHeaders {
    const token = this.auth.getToken();
    const headersConfig: { [key: string]: string } = {};
    if (token) headersConfig['Authorization'] = `Bearer ${token}`;
    if (jsonContent) headersConfig['Content-Type'] = 'application/json';
    return new HttpHeaders(headersConfig);
  }

  // ------------------------
  // QUOTES API
  // ------------------------
  getQuotes(): Observable<Quote[]> {
    if (!this.auth.isAuthenticated()) return of([]);
    return this.http.get<Quote[]>(`${this.apiUrl}/quotes?mine=true`, {
      headers: this.getAuthHeaders()
    });
  }

  getQuote(id: number): Observable<Quote> {
    return this.http.get<Quote>(`${this.apiUrl}/quotes/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  createQuote(quote: Quote): Observable<Quote> {
    if (!this.auth.isAuthenticated()) throw new Error('Not logged in');
    const payload = {
      ...quote,
      userId: this.auth.getCurrentUserId(), // NEW: uses AuthService
      bookId: quote.bookId || null
    };
    return this.http.post<Quote>(`${this.apiUrl}/quotes`, payload, {
      headers: this.getAuthHeaders(true)
    });
  }

  updateQuote(id: number, quote: Quote): Observable<Quote> {
    const payload = {
      ...quote,
      userId: this.auth.getCurrentUserId(), // NEW
      bookId: quote.bookId || null
    };
    return this.http.put<Quote>(`${this.apiUrl}/quotes/${id}`, payload, {
      headers: this.getAuthHeaders(true)
    });
  }

  deleteQuote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/quotes/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  getQuotesByBookId(bookId: number): Observable<Quote[]> {
    return this.http.get<Quote[]>(`${this.apiUrl}/books/${bookId}/quotes`, {
      headers: this.getAuthHeaders()
    });
  }
}
