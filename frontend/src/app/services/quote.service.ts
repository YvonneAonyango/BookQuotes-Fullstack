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
  ) {
    console.log('QuoteService API URL:', this.apiUrl);
  }

  private getAuthHeaders(jsonContent: boolean = false): HttpHeaders {
    const token = this.auth.getToken();
    const headersConfig: { [key: string]: string } = {};
    if (token) {
      headersConfig['Authorization'] = `Bearer ${token}`;
    }
    if (jsonContent) headersConfig['Content-Type'] = 'application/json';
    return new HttpHeaders(headersConfig);
  }

  getQuotes(): Observable<Quote[]> {
    const url = `${this.apiUrl}/quotes?mine=true`;
    console.log('Fetching quotes:', url);
    
    return this.http.get<Quote[]>(url, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error loading quotes:', error);
        return throwError(() => error);
      })
    );
  }

  getQuote(id: number): Observable<Quote> {
    return this.http.get<Quote>(`${this.apiUrl}/quotes/${id}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  createQuote(quote: Quote): Observable<Quote> {
    if (!this.auth.isAuthenticated()) {
      throw new Error('Not logged in');
    }

    const userId = this.auth.getCurrentUserId();
    console.log('Creating quote, User ID:', userId);

    const payload = {
      Text: quote.text.trim(),
      Author: quote.author.trim(),
      UserId: userId || 0,
      ...(quote.bookId && { BookId: quote.bookId })
    };

    const url = `${this.apiUrl}/quotes`;
    console.log('POST to:', url, 'Payload:', payload);

    return this.http.post<Quote>(url, payload, {
      headers: this.getAuthHeaders(true),
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Create quote error:', error);
        return throwError(() => error);
      })
    );
  }

  updateQuote(id: number, quote: Quote): Observable<Quote> {
    const userId = this.auth.getCurrentUserId();
    
    const payload = {
      Text: quote.text.trim(),
      Author: quote.author.trim(),
      UserId: userId || 0,
      ...(quote.bookId && { BookId: quote.bookId })
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