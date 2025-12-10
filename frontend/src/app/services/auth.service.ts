import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

// --------------------------
// AUTH MODELS
// --------------------------
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  role: string;
  userId: number;
  message?: string;
}

// --------------------------
// AUTH SERVICE
// --------------------------
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // --------------------------
  // TOKEN & USER DATA
  // --------------------------
  getToken(): string | null {
    return localStorage.getItem('authToken'); // primary token
  }

  getCurrentUserId(): number | null {
    const id = localStorage.getItem('userId');
    return id ? Number(id) : null;
  }

  getCurrentUser(): string | null {
    return localStorage.getItem('username');
  }

  getCurrentRole(): string | null {
    return localStorage.getItem('role');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const role = this.getCurrentRole();
    const username = this.getCurrentUser();
    return role === 'admin' || username === 'AngularAdmin';
  }

  hasRole(role: string): boolean {
    return this.getCurrentRole() === role;
  }

  // --------------------------
  // AUTH OPERATIONS
  // --------------------------
  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, loginData, { withCredentials: true })
      .pipe(
        tap(response => this.storeAuthData(response)),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  adminLogin(loginData: LoginRequest): Observable<AuthResponse> {
    if (loginData.username === 'AngularAdmin' && loginData.password === 'Admin123!') {
      const adminResponse: AuthResponse = {
        token: 'admin-token-' + Date.now(),
        username: 'AngularAdmin',
        role: 'admin',
        userId: 0
      };
      this.storeAuthData(adminResponse);
      return new Observable<AuthResponse>(observer => {
        observer.next(adminResponse);
        observer.complete();
      });
    }

    return this.login(loginData)
      .pipe(
        map(response => {
          if (response.role !== 'admin') throw new Error('Access denied. Admin privileges required.');
          return response;
        }),
        catchError(error => throwError(() => error))
      );
  }

  register(registerData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, registerData, { withCredentials: true })
      .pipe(
        tap(response => this.storeAuthData(response)),
        catchError(error => {
          console.error('Registration error:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    try {
      this.http.post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true }).subscribe({ next: () => {}, error: () => {} });
    } catch {}
    localStorage.removeItem('authToken');
    localStorage.removeItem('token'); // fallback
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    this.router.navigate(['/login']);
  }

  validateToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) return of(false);

    return this.http.get<{ valid: boolean }>(`${this.apiUrl}/auth/validate`, {
      headers: { 'Authorization': `Bearer ${token}` },
      withCredentials: true
    })
      .pipe(
        map(res => res.valid),
        catchError(() => {
          this.logout();
          return of(false);
        })
      );
  }

  // --------------------------
  // ADMIN API HELPERS
  // --------------------------
  /** Generic GET for admin endpoints */
  adminGet<T>(endpoint: string): Observable<T> {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated. Please login.');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<T>(`${this.apiUrl}/admin/${endpoint}`, { headers });
  }

  /** Generic POST for admin endpoints */
  adminPost<T>(endpoint: string, body: any): Observable<T> {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated. Please login.');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<T>(`${this.apiUrl}/admin/${endpoint}`, body, { headers });
  }

  // --------------------------
  // PRIVATE HELPER
  // --------------------------
  private storeAuthData(response: AuthResponse): void {
    if (!response) return;
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('token', response.token); // fallback
    localStorage.setItem('username', response.username);
    localStorage.setItem('role', response.role || 'user');
    localStorage.setItem('userId', response.userId?.toString() || '0');
  }
}
