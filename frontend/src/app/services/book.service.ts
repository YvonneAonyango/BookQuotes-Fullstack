import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

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
  private apiUrl = 'http://localhost:5298/api/books';

  constructor(private http: HttpClient) {}

  // Helper method to get token from ANY possible key
  private getToken(): string | null {
    return localStorage.getItem('authToken') || 
           localStorage.getItem('token') || 
           localStorage.getItem('bookapp_token') ||
           localStorage.getItem('quotesTest');
  }

  // Helper method to create headers with token
  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
    }
    
    return new HttpHeaders();
  }

  getBooks(): Observable<Book[]> {
    const token = this.getToken();
    
    if (!token) {
      console.error('❌ BookService: No token found! User needs to login.');
      return throwError(() => new Error('Not authenticated. Please login first.'));
    }
    
    console.log('📤 BookService: Sending request with Authorization header');
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.get<Book[]>(this.apiUrl, { headers });
  }

  getBook(id: number): Observable<Book> {
    const token = this.getToken();
    
    if (!token) {
      console.error('❌ BookService: No token for getBook');
      return throwError(() => new Error('Not authenticated'));
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.get<Book>(`${this.apiUrl}/${id}`, { headers });
  }

  createBook(book: Book): Observable<Book> {
    const token = this.getToken();
    
    if (!token) {
      console.error('BookService: No token for createBook');
      return throwError(() => new Error('Not authenticated'));
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    return this.http.post<Book>(this.apiUrl, book, { headers });
  }

  updateBook(id: number, book: Book): Observable<Book> {
    const token = this.getToken();
    
    if (!token) {
      console.error('❌ BookService: No token for updateBook');
      return throwError(() => new Error('Not authenticated'));
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    return this.http.put<Book>(`${this.apiUrl}/${id}`, book, { headers });
  }

  deleteBook(id: number): Observable<void> {
    const token = this.getToken();
    
    if (!token) {
      console.error('❌ BookService: No token for deleteBook');
      return throwError(() => new Error('Not authenticated'));
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }
}