import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../environments/environment';

export interface Quote {
  id?: number;
  text: string;
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

  private getAuthHeaders(contentType = false): HttpHeaders {
    const token = this.getToken();
    if (!token) return new HttpHeaders();

    if (contentType) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  getQuotes(): Observable<Quote[]> {
    return this.http.get<Quote[]>(`${this.apiUrl}/quotes`, { headers: this.getAuthHeaders() });
  }

  getQuote(id: number): Observable<Quote> {
    return this.http.get<Quote>(`${this.apiUrl}/quotes/${id}`, { headers: this.getAuthHeaders() });
  }

  createQuote(quote: Quote): Observable<Quote> {
    return this.http.post<Quote>(`${this.apiUrl}/quotes`, quote, { headers: this.getAuthHeaders(true) });
  }

  updateQuote(id: number, quote: Quote): Observable<Quote> {
    return this.http.put<Quote>(`${this.apiUrl}/quotes/${id}`, quote, { headers: this.getAuthHeaders(true) });
  }

  deleteQuote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/quotes/${id}`, { headers: this.getAuthHeaders() });
  }
}
