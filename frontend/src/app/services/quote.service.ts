import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Quote {
  id?: number;
  text: string;
  author: string;
  bookId?: number | null;
  userId?: number;
  isGlobal?: boolean;
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
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  }

  private getAuthHeaders(jsonContent: boolean = false): HttpHeaders {
    const token = this.getToken();
    const headersConfig: { [key: string]: string } = {};
    if (token) headersConfig['Authorization'] = `Bearer ${token}`;
    if (jsonContent) headersConfig['Content-Type'] = 'application/json';
    return new HttpHeaders(headersConfig);
  }

  // Get all global quotes (public)
  getGlobalQuotes(): Observable<Quote[]> {
    return this.http.get<Quote[]>(`${this.apiUrl}/quotes/global`)
      .pipe(catchError(error => throwError(() => error)));
  }

  // Get current user's quotes (owner only)
  getMyQuotes(): Observable<Quote[]> {
    return this.http.get<Quote[]>(`${this.apiUrl}/quotes/my`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(error => throwError(() => error)));
  }

  createQuote(quote: Quote): Observable<Quote> {
    const payload = {
      Text: quote.text.trim(),
      Author: quote.author.trim(),
      BookId: quote.bookId && quote.bookId > 0 ? quote.bookId : null
    };

    return this.http.post<Quote>(`${this.apiUrl}/quotes`, payload, {
      headers: this.getAuthHeaders(true)
    }).pipe(catchError(error => throwError(() => error)));
  }

  updateQuote(id: number, quote: Quote): Observable<Quote> {
    const payload = {
      Text: quote.text.trim(),
      Author: quote.author.trim(),
      BookId: quote.bookId && quote.bookId > 0 ? quote.bookId : null
    };

    return this.http.put<Quote>(`${this.apiUrl}/quotes/${id}`, payload, {
      headers: this.getAuthHeaders(true)
    }).pipe(catchError(error => throwError(() => error)));
  }

  deleteQuote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/quotes/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(error => throwError(() => error)));
  }
}
