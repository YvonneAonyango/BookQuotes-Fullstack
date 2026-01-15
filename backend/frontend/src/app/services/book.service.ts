import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, map } from 'rxjs';
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
  publishDate?: string; // frontend uses camelCase
  quotes?: Quote[];
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private apiUrl = `${environment.apiUrl}/books`;

  constructor(private http: HttpClient) {}

  // Map backend PublishDate → frontend publishDate
  private mapBookFromApi(book: any): Book {
    return {
      id: book.id,
      title: book.title,
      author: book.author,
      publishDate: book.publishDate ?? book.PublishDate, // handle both
      quotes: book.quotes
    };
  }

  private mapBooksFromApi(books: any[]): Book[] {
    return books.map(b => this.mapBookFromApi(b));
  }

  // Books are public - NO auth required for GET
  getBooks(): Observable<Book[]> {
    return this.http.get<any[]>(this.apiUrl)
      .pipe(
        map(books => this.mapBooksFromApi(books)),
        catchError(err => {
          console.error('Error loading books:', err);
          return throwError(() => err);
        })
      );
  }

  getBook(id: number): Observable<Book> {
    return this.http.get<any>(`${this.apiUrl}/${id}`)
      .pipe(
        map(book => this.mapBookFromApi(book)),
        catchError(err => {
          console.error(`Error loading book ${id}:`, err);
          return throwError(() => err);
        })
      );
  }

  // CREATE, UPDATE, DELETE still need auth
  createBook(book: Book): Observable<Book> {
    return this.http.post<Book>(this.apiUrl, book)
      .pipe(
        catchError(err => {
          console.error('Error creating book:', err);
          return throwError(() => err);
        })
      );
  }

  updateBook(id: number, book: Book): Observable<Book> {
    return this.http.put<Book>(`${this.apiUrl}/${id}`, book)
      .pipe(
        catchError(err => {
          console.error(`Error updating book ${id}:`, err);
          return throwError(() => err);
        })
      );
  }

  deleteBook(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(err => {
          console.error(`Error deleting book ${id}:`, err);
          return throwError(() => err);
        })
      );
  }
}