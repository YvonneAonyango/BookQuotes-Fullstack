import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

// AUTH MODELS
export interface LoginRequest { username: string; password: string; }
export interface RegisterRequest { username: string; password: string; confirmPassword: string; }
export interface AuthResponse { 
  token: string; 
  username: string; 
  role: string; 
  userId: number; 
  message?: string; 
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  // ---------------- TOKEN & USER INFO ----------------
  getToken(): string | null { return localStorage.getItem('authToken'); }
  getCurrentUser(): string | null { return localStorage.getItem('username'); }
  getCurrentRole(): string | null { return localStorage.getItem('role'); }
  getCurrentUserId(): number | null {
    const id = localStorage.getItem('userId');
    return id ? Number(id) : null;
  }

  isAuthenticated(): boolean { return !!this.getToken(); }
  isAdmin(): boolean { return this.getCurrentRole() === 'admin'; }

  // ---------------- AUTH OPERATIONS ----------------
  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, data, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }).pipe(
      tap(res => {
        console.log('Login response:', res);
        this.storeAuthData(res);
      }),
      catchError(this.handleError)
    );
  }

  adminLogin(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/admin/login`, data, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }).pipe(
      tap(res => {
        console.log('Admin login response:', res);
        if (res.role.toLowerCase() !== 'admin') {
          this.clearAuthData();
          throw new Error('Admin privileges required');
        }
        this.storeAuthData(res);
      }),
      catchError(this.handleError)
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }).pipe(
      tap(res => {
        console.log('Register response:', res);
        this.storeAuthData(res);
      }),
      catchError(this.handleError)
    );
  }

  logout(): void {
    this.clearAuthData();
    this.router.navigate(['/login']);
  }

  validateToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) return of(false);

    return this.http.post<{ valid: boolean }>(`${this.apiUrl}/auth/validate-token`, { token }, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    }).pipe(
      map(res => res.valid),
      catchError(() => { 
        this.logout(); 
        return of(false); 
      })
    );
  }

  getUserInfo(): Observable<AuthResponse | null> {
    const token = this.getToken();
    if (!token) return of(null);

    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    return this.http.get<AuthResponse>(`${this.apiUrl}/auth/user-info`, { headers }).pipe(
      catchError(() => of(null))
    );
  }

  // ---------------- ADMIN API ----------------
  adminRequest<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: string, body?: any): Observable<T> {
    const token = this.getToken();
    if (!token) return throwError(() => new Error('Not authenticated'));

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const url = `${this.apiUrl}/admin/${endpoint}`;

    switch (method) {
      case 'GET': return this.http.get<T>(url, { headers }).pipe(catchError(this.handleError));
      case 'POST': return this.http.post<T>(url, body, { headers }).pipe(catchError(this.handleError));
      case 'PUT': return this.http.put<T>(url, body, { headers }).pipe(catchError(this.handleError));
      case 'DELETE': return this.http.delete<T>(url, { headers }).pipe(catchError(this.handleError));
    }
  }

  private storeAuthData(res: AuthResponse): void {
    if (!res || !res.token) {
      console.error('Invalid auth response:', res);
      return;
    }
    console.log('Storing auth data:', { 
      token: res.token.substring(0, 20) + '...', 
      username: res.username, 
      role: res.role 
    });
    
    localStorage.setItem('authToken', res.token);
    localStorage.setItem('username', res.username);
    localStorage.setItem('role', res.role.toLowerCase());
    localStorage.setItem('userId', res.userId?.toString() ?? '0');
  }

  private clearAuthData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
  }

  private handleError(error: HttpErrorResponse) {
    console.error('AuthService error:', error);
    
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.message || error.statusText || `Error Code: ${error.status}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}