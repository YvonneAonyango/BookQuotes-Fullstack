import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Book {
  id?: number;
  title: string;
  author: string;
  publicationDate: string; // ISO string
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
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

  getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.apiUrl}/books`, { headers: this.getAuthHeaders() });
  }

  getBook(id: number): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}/books/${id}`, { headers: this.getAuthHeaders() });
  }

  createBook(book: Book): Observable<Book> {
    return this.http.post<Book>(`${this.apiUrl}/books`, book, { headers: this.getAuthHeaders(true) });
  }

  updateBook(id: number, book: Book): Observable<Book> {
    return this.http.put<Book>(`${this.apiUrl}/books/${id}`, book, { headers: this.getAuthHeaders(true) });
  }

  deleteBook(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/books/${id}`, { headers: this.getAuthHeaders() });
  }
}
