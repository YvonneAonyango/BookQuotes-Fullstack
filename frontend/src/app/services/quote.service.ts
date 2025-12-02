import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

export interface Quote {
  id?: number;
  text: string;
  author: string;
}

@Injectable({
  providedIn: 'root'
})
export class QuoteService {
  private apiUrl = 'http://localhost:5298/api/quotes';

  constructor(private http: HttpClient) {}

  // Helper method to get token from ANY possible key
  private getToken(): string | null {
    return localStorage.getItem('authToken') || 
           localStorage.getItem('token') || 
           localStorage.getItem('bookapp_token') ||
           localStorage.getItem('quotesTest');
  }

  // Helper method to create headers with token
  private getAuthHeaders(contentType: boolean = false): HttpHeaders {
    const token = this.getToken();
    
    if (!token) {
      return new HttpHeaders();
    }
    
    if (contentType) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Get all quotes
  getQuotes(): Observable<Quote[]> {
    const token = this.getToken();
    
    if (!token) {
      console.error('❌ QuoteService: No token found! User needs to login.');
      return throwError(() => new Error('Not authenticated. Please login first.'));
    }
    
    console.log('📤 QuoteService: Getting quotes with token');
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.get<Quote[]>(this.apiUrl, { headers });
  }

  // Get a single quote by id
  getQuote(id: number): Observable<Quote> {
    const token = this.getToken();
    
    if (!token) {
      console.error('❌ QuoteService: No token for getQuote');
      return throwError(() => new Error('Not authenticated'));
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.get<Quote>(`${this.apiUrl}/${id}`, { headers });
  }

  // Create a new quote
  createQuote(quote: Quote): Observable<Quote> {
    const token = this.getToken();
    
    if (!token) {
      console.error('❌ QuoteService: No token for createQuote');
      return throwError(() => new Error('Not authenticated'));
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    return this.http.post<Quote>(this.apiUrl, quote, { headers });
  }

  // Update an existing quote
  updateQuote(id: number, quote: Quote): Observable<Quote> {
    const token = this.getToken();
    
    if (!token) {
      console.error('❌ QuoteService: No token for updateQuote');
      return throwError(() => new Error('Not authenticated'));
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    return this.http.put<Quote>(`${this.apiUrl}/${id}`, quote, { headers });
  }

  // Delete a quote
  deleteQuote(id: number): Observable<void> {
    const token = this.getToken();
    
    if (!token) {
      console.error('❌ QuoteService: No token for deleteQuote');
      return throwError(() => new Error('Not authenticated'));
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }
}