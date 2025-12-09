import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

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

  constructor(private http: HttpClient) {}

  private getToken(): string | null {
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  }

  private getAuthHeaders(jsonContent: boolean = false): HttpHeaders {
    const token = this.getToken();
    if (!token) return new HttpHeaders();

    const headersConfig: { [key: string]: string } = {
      'Authorization': `Bearer ${token}`
    };
    if (jsonContent) headersConfig['Content-Type'] = 'application/json';
    return new HttpHeaders(headersConfig);
  }

  getQuotes(): Observable<Quote[]> {
    const token = this.getToken();
    if (!token) return of([]); // Return empty array if not logged in
    return this.http.get<Quote[]>(`${this.apiUrl}/quotes?mine=true`, {
      headers: this.getAuthHeaders()
    });
  }

  getQuote(id: number): Observable<Quote> {
    return this.http.get<Quote>(`${this.apiUrl}/quotes/${id}`, { headers: this.getAuthHeaders() });
  }

  createQuote(quote: Quote): Observable<Quote> {
    const payload = { ...quote, bookId: quote.bookId || null };
    return this.http.post<Quote>(`${this.apiUrl}/quotes`, payload, { headers: this.getAuthHeaders(true) });
  }

  updateQuote(id: number, quote: Quote): Observable<Quote> {
    const payload = { ...quote, bookId: quote.bookId || null };
    return this.http.put<Quote>(`${this.apiUrl}/quotes/${id}`, payload, { headers: this.getAuthHeaders(true) });
  }

  deleteQuote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/quotes/${id}`, { headers: this.getAuthHeaders() });
  }

  getQuotesByBookId(bookId: number): Observable<Quote[]> {
    return this.http.get<Quote[]>(`${this.apiUrl}/books/${bookId}/quotes`, { headers: this.getAuthHeaders() });
  }
}