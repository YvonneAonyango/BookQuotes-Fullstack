import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  isGlobal?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class QuoteService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private auth: AuthService) {}

  // Get user's quotes (requires auth)
  getMyQuotes(): Observable<Quote[]> {
    if (!this.auth.isAuthenticated()) {
      return throwError(() => new Error('Not authenticated'));
    }
    
    return this.http.get<Quote[]>(`${this.apiUrl}/quotes/my`)
      .pipe(
        catchError(error => {
          console.error('Error loading user quotes:', error);
          return throwError(() => error);
        })
      );
  }

  // Get global quotes (public, no auth needed)
  getGlobalQuotes(): Observable<Quote[]> {
    return this.http.get<Quote[]>(`${this.apiUrl}/quotes/global`)
      .pipe(
        catchError(error => {
          console.error('Error loading global quotes:', error);
          return throwError(() => error);
        })
      );
  }

  createQuote(quote: Quote): Observable<Quote> {
    if (!this.auth.isAuthenticated()) {
      return throwError(() => new Error('Not authenticated'));
    }

    // Use camelCase to match C# model
    const payload = {
      text: quote.text.trim(),
      author: quote.author.trim(),
      bookId: quote.bookId && quote.bookId > 0 ? quote.bookId : null
      // UserId will be set by backend from token
    };

    return this.http.post<Quote>(`${this.apiUrl}/quotes`, payload)
      .pipe(
        catchError(error => {
          console.error('Error creating quote:', error);
          return throwError(() => error);
        })
      );
  }

  updateQuote(id: number, quote: Quote): Observable<Quote> {
    if (!this.auth.isAuthenticated()) {
      return throwError(() => new Error('Not authenticated'));
    }

    const payload = {
      text: quote.text.trim(),
      author: quote.author.trim(),
      bookId: quote.bookId && quote.bookId > 0 ? quote.bookId : null
    };

    return this.http.put<Quote>(`${this.apiUrl}/quotes/${id}`, payload)
      .pipe(
        catchError(error => {
          console.error('Error updating quote:', error);
          return throwError(() => error);
        })
      );
  }

  deleteQuote(id: number): Observable<void> {
    if (!this.auth.isAuthenticated()) {
      return throwError(() => new Error('Not authenticated'));
    }

    return this.http.delete<void>(`${this.apiUrl}/quotes/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error deleting quote:', error);
          return throwError(() => error);
        })
      );
  }
}