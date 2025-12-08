import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Quote {
  id?: number;
  text: string;
  author: string;
}

export interface Book {
  id?: number;
  title: string;
  author: string;
  publishDate?: string; // camelCase for Angular
  quotes?: Quote[];
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private apiUrl = `${environment.apiUrl}/books`;

  constructor(private http: HttpClient) {}

  private getToken(): string | null {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  }

  private getAuthHeaders(json = false): HttpHeaders {
    const token = this.getToken();
    if (!token) return new HttpHeaders();

    return json
      ? new HttpHeaders({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' })
      : new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(this.apiUrl, { headers: this.getAuthHeaders() })
      .pipe(catchError(err => throwError(() => err)));
  }

  getBook(id: number): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(err => throwError(() => err)));
  }

  createBook(book: Book): Observable<Book> {
    return this.http.post<Book>(this.apiUrl, book, { headers: this.getAuthHeaders(true) })
      .pipe(catchError(err => throwError(() => err)));
  }

  updateBook(id: number, book: Book): Observable<Book> {
    return this.http.put<Book>(`${this.apiUrl}/${id}`, book, { headers: this.getAuthHeaders(true) })
      .pipe(catchError(err => throwError(() => err)));
  }

  deleteBook(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(err => throwError(() => err)));
  }
}