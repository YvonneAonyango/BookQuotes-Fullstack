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

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getAuthHeaders(jsonContent: boolean = false): HttpHeaders {
    const token = this.auth.getToken();
    const headersConfig: { [key: string]: string } = {};
    if (token) headersConfig['Authorization'] = `Bearer ${token}`;
    if (jsonContent) headersConfig['Content-Type'] = 'application/json';
    return new HttpHeaders(headersConfig);
  }

  // PUBLIC: loads seeded, public quotes
  getQuotes(): Observable<Quote[]> {
    return this.http.get<Quote[]>(`${this.apiUrl}/quotes`)
      .pipe(catchError(error => throwError(() => error)));
  }

  // AUTH REQUIRED
  createQuote(quote: Quote): Observable<Quote> {
    if (!this.auth.isAuthenticated()) {
      throw new Error('Not logged in');
    }

    const payload = {
      Text: quote.text.trim(),
      Author: quote.author.trim(),
      BookId: quote.bookId && quote.bookId > 0 ? quote.bookId : null
    };

    return this.http.post<Quote>(`${this.apiUrl}/quotes`, payload, {
      headers: this.getAuthHeaders(true)
    }).pipe(catchError(error => throwError(() => error)));
  }

  // AUTH REQUIRED
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

  // AUTH REQUIRED
  deleteQuote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/quotes/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(error => throwError(() => error)));
  }
}