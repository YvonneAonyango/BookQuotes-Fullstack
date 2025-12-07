import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Quote {
  id?: number;
  text: string;
  author: string;
  bookId?: number | null;
}

// Create a separate type for creating/updating quotes
export interface QuoteInput {
  text: string;
  author: string;
  bookId?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class QuoteService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /** Get token from local storage */
  private getToken(): string | null {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  }

  /** Build HTTP headers with optional JSON content type */
  private getAuthHeaders(jsonContent: boolean = false): HttpHeaders {
    const token = this.getToken();
    if (!token) return new HttpHeaders();

    const headersConfig: { [key: string]: string } = {
      'Authorization': `Bearer ${token}`
    };

    if (jsonContent) headersConfig['Content-Type'] = 'application/json';

    return new HttpHeaders(headersConfig);
  }

  /** Fetch all quotes */
  getQuotes(): Observable<Quote[]> {
    return this.http.get<Quote[]>(`${this.apiUrl}/quotes`, { headers: this.getAuthHeaders() });
  }

  /** Fetch single quote by ID */
  getQuote(id: number): Observable<Quote> {
    return this.http.get<Quote>(`${this.apiUrl}/quotes/${id}`, { headers: this.getAuthHeaders() });
  }

  /** Create a new quote - accepts QuoteInput (no id) */
  createQuote(quote: QuoteInput): Observable<Quote> {
    const payload = {
      text: quote.text,
      author: quote.author,
      bookId: quote.bookId || null
    };
    return this.http.post<Quote>(`${this.apiUrl}/quotes`, payload, { 
      headers: this.getAuthHeaders(true) 
    });
  }

  /** Update an existing quote - accepts QuoteInput (no id) */
  updateQuote(id: number, quote: QuoteInput): Observable<Quote> {
    const payload = {
      text: quote.text,
      author: quote.author,
      bookId: quote.bookId || null
    };
    return this.http.put<Quote>(`${this.apiUrl}/quotes/${id}`, payload, { 
      headers: this.getAuthHeaders(true) 
    });
  }

  /** Delete a quote by ID */
  deleteQuote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/quotes/${id}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  /** Fetch quotes by book ID */
  getQuotesByBookId(bookId: number): Observable<Quote[]> {
    return this.http.get<Quote[]>(`${this.apiUrl}/books/${bookId}/quotes`, { 
      headers: this.getAuthHeaders() 
    });
  }
}