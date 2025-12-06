import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// =========================
// QUOTE MODEL
// =========================
export interface Quote {
  id?: number;
  text: string;
  author: string; // Make sure author exists
}

// =========================
// QUOTE SERVICE
// =========================
@Injectable({
  providedIn: 'root'
})
export class QuoteService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // =========================
  // HELPER FUNCTIONS
  // =========================

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

  // =========================
  // API METHODS
  // =========================

  /** Fetch all quotes */
  getQuotes(): Observable<Quote[]> {
    return this.http.get<Quote[]>(`${this.apiUrl}/quotes`, { headers: this.getAuthHeaders() });
  }

  /** Fetch single quote by ID */
  getQuote(id: number): Observable<Quote> {
    return this.http.get<Quote>(`${this.apiUrl}/quotes/${id}`, { headers: this.getAuthHeaders() });
  }

  /** Create a new quote */
  createQuote(quote: Quote): Observable<Quote> {
    return this.http.post<Quote>(`${this.apiUrl}/quotes`, quote, { headers: this.getAuthHeaders(true) });
  }

  /** Update an existing quote */
  updateQuote(id: number, quote: Quote): Observable<Quote> {
    return this.http.put<Quote>(`${this.apiUrl}/quotes/${id}`, quote, { headers: this.getAuthHeaders(true) });
  }

  /** Delete a quote by ID */
  deleteQuote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/quotes/${id}`, { headers: this.getAuthHeaders() });
  }
}
