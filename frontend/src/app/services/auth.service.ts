import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

// =========================
// AUTH MODELS
// =========================
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

// =========================
// AUTH SERVICE
// =========================
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // =========================
  // HELPER METHODS
  // =========================

  /** Get token from local storage */
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /** Get current user ID */
  getCurrentUserId(): number | null {
    const id = localStorage.getItem('userId');
    return id ? Number(id) : null;
  }

  /** Get current username */
  getCurrentUser(): string | null {
    return localStorage.getItem('username');
  }

  /** Get current role */
  getCurrentRole(): string | null {
    return localStorage.getItem('role');
  }

  /** Check if user is authenticated */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /** Check if user is admin */
  isAdmin(): boolean {
    const role = this.getCurrentRole();
    const username = this.getCurrentUser();
    return role === 'admin' || username === 'AngularAdmin';
  }

  /** Check if user has specific role */
  hasRole(role: string): boolean {
    return this.getCurrentRole() === role;
  }

  // =========================
  // AUTH METHODS
  // =========================

  /** Regular login */
  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, loginData)
      .pipe(
        tap(response => this.storeAuthData(response)),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  /** Admin login (special AngularAdmin check) */
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

  /** User registration */
  register(registerData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, registerData)
      .pipe(
        tap(response => this.storeAuthData(response)),
        catchError(error => {
          console.error('Registration error:', error);
          return throwError(() => error);
        })
      );
  }

  /** Logout user */
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    this.router.navigate(['/login']);
  }

  /** Optional: validate token with backend */
  validateToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) return of(false);

    return this.http.get<{ valid: boolean }>(`${this.apiUrl}/auth/validate`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .pipe(
        map(res => res.valid),
        catchError(() => {
          this.logout();
          return of(false);
        })
      );
  }

  // =========================
  // PRIVATE HELPER
  // =========================
  private storeAuthData(response: AuthResponse): void {
    if (!response) return;
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('username', response.username);
    localStorage.setItem('role', response.role || 'user');
    localStorage.setItem('userId', response.userId?.toString() || '0');
  }
}
