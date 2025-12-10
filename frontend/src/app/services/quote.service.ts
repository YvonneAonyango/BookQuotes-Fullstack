import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Book {
  id: number;
  title: string;
  author: string;
}

export interface Quote {
  id?: number;
  text: string;
  author: string;
  bookId?: number | null;
  userId?: number;
  book?: Book;
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

  private getAuthHeaders(jsonContent: boolean = false): HttpHeaders {
    const token = this.auth.getToken();
    const headersConfig: { [key: string]: string } = {};
    if (token) headersConfig['Authorization'] = `Bearer ${token}`;
    if (jsonContent) headersConfig['Content-Type'] = 'application/json';
    return new HttpHeaders(headersConfig);
  }

  getQuotes(): Observable<Quote[]> {
    return this.http.get<Quote[]>(`${this.apiUrl}/quotes?mine=true`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(catchError(error => throwError(() => error)));
  }

  getQuote(id: number): Observable<Quote> {
    return this.http.get<Quote>(`${this.apiUrl}/quotes/${id}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(catchError(error => throwError(() => error)));
  }

  createQuote(quote: Quote): Observable<Quote> {
    if (!this.auth.isAuthenticated()) throw new Error('Not logged in');
    const userId = this.auth.getCurrentUserId();

    const payload = {
      Text: quote.text.trim(),
      Author: quote.author.trim(),
      UserId: userId || 0,
      BookId: quote.bookId ?? null   // always number or null
    };

    return this.http.post<Quote>(`${this.apiUrl}/quotes`, payload, {
      headers: this.getAuthHeaders(true),
      withCredentials: true
    }).pipe(catchError(error => throwError(() => error)));
  }

  updateQuote(id: number, quote: Quote): Observable<Quote> {
    const userId = this.auth.getCurrentUserId();

    const payload = {
      Text: quote.text.trim(),
      Author: quote.author.trim(),
      UserId: userId || 0,
      BookId: quote.bookId ?? null   // always number or null
    };

    return this.http.put<Quote>(`${this.apiUrl}/quotes/${id}`, payload, {
      headers: this.getAuthHeaders(true),
      withCredentials: true
    }).pipe(catchError(error => throwError(() => error)));
  }

  deleteQuote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/quotes/${id}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(catchError(error => throwError(() => error)));
  }

  getQuotesByBookId(bookId: number): Observable<Quote[]> {
    return this.http.get<Quote[]>(`${this.apiUrl}/books/${bookId}/quotes`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(catchError(error => throwError(() => error)));
  }
}
