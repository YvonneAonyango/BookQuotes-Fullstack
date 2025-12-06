import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
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

  /** Check if user is authenticated */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /** Check if user is admin */
  isAdmin(): boolean {
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    
    // Check for explicit admin credentials
    return role === 'admin' || username === 'AngularAdmin';
  }

  /** Get current username */
  getCurrentUser(): string | null {
    return localStorage.getItem('username');
  }

  /** Get current user role */
  getCurrentRole(): string | null {
    return localStorage.getItem('role');
  }

  // =========================
  // AUTH METHODS
  // =========================

  /** Regular user login */
  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, loginData)
      .pipe(
        tap(response => {
          if (response.token) {
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('username', response.username);
            localStorage.setItem('role', response.role || 'user');
          }
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  /** Admin-specific login (with special validation) */
  adminLogin(loginData: LoginRequest): Observable<AuthResponse> {
    // Check for explicit admin credentials first
    if (loginData.username === 'AngularAdmin' && loginData.password === 'Admin123!') {
      // Create admin response
      const adminResponse: AuthResponse = {
        token: 'admin-token-' + Date.now(),
        username: 'AngularAdmin',
        role: 'admin'
      };
      
      // Store in localStorage
      localStorage.setItem('authToken', adminResponse.token);
      localStorage.setItem('username', adminResponse.username);
      localStorage.setItem('role', adminResponse.role);
      
      // Return as observable
      return new Observable<AuthResponse>(observer => {
        observer.next(adminResponse);
        observer.complete();
      });
    }
    
    // If not AngularAdmin, use regular login but check role
    return this.login(loginData)
      .pipe(
        map(response => {
          // If role is not admin, throw error
          if (response.role !== 'admin') {
            throw new Error('Access denied. Admin privileges required.');
          }
          return response;
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  /** User registration */
  register(registerData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, registerData)
      .pipe(
        tap(response => {
          if (response.token) {
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('username', response.username);
            localStorage.setItem('role', response.role || 'user');
          }
        }),
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
    this.router.navigate(['/login']);
  }

  /** Check if user has specific role */
  hasRole(role: string): boolean {
    const userRole = this.getCurrentRole();
    return userRole === role;
  }

  /** Validate token (optional - for checking if token is still valid) */
  validateToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return of(false);
    }

    return this.http.get<{ valid: boolean }>(`${this.apiUrl}/auth/validate`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .pipe(
        map(response => response.valid),
        catchError(() => {
          // If validation fails, clear storage
          this.logout();
          return of(false);
        })
      );
  }
}