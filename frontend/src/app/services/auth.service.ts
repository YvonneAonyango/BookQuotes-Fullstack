import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

// AUTH MODELS
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  confirmPassword: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  role: string;
  userId: number;
  message?: string;
}

// AUTH SERVICE
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  // TOKEN & USER DATA
  getToken(): string | null {
    return localStorage.getItem('authToken'); 
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
    return this.getCurrentRole()?.toLowerCase() === 'admin';
  }

  hasRole(role: string): boolean {
    return this.getCurrentRole()?.toLowerCase() === role.toLowerCase();
  }

  // AUTH OPERATIONS
  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, loginData)
      .pipe(
        tap(res => this.storeAuthData(res)),
        catchError(err => throwError(() => err))
      );
  }

  adminLogin(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/admin/login`, loginData)
      .pipe(
        tap(res => {
          if (res.role.toLowerCase() !== 'admin') {
            throw new Error('Access denied. Admin privileges required.');
          }
          this.storeAuthData(res);
        }),
        catchError(err => throwError(() => err))
      );
  }

  register(registerData: RegisterRequest): Observable<AuthResponse> {
    if (!registerData.role) registerData.role = 'User';
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, registerData)
      .pipe(
        tap(res => this.storeAuthData(res)),
        catchError(err => throwError(() => err))
      );
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    this.router.navigate(['/login']);
  }

  validateToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) return of(false);

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.post<{ valid: boolean }>(`${this.apiUrl}/auth/validate-token`, { token }, { headers })
      .pipe(
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

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.get<AuthResponse>(`${this.apiUrl}/auth/user-info`, { headers })
      .pipe(catchError(() => of(null)));
  }

  // ADMIN API HELPERS
  adminGet<T>(endpoint: string): Observable<T> {
    return this.requestWithToken<T>('GET', endpoint);
  }

  adminPost<T>(endpoint: string, body: any): Observable<T> {
    return this.requestWithToken<T>('POST', endpoint, body);
  }

  adminPut<T>(endpoint: string, body: any): Observable<T> {
    return this.requestWithToken<T>('PUT', endpoint, body);
  }

  adminDelete<T>(endpoint: string): Observable<T> {
    return this.requestWithToken<T>('DELETE', endpoint);
  }

  // PRIVATE HELPERS
  private storeAuthData(res: AuthResponse): void {
    if (!res) return;
    localStorage.setItem('authToken', res.token);
    localStorage.setItem('username', res.username);
    localStorage.setItem('role', res.role.toLowerCase());
    localStorage.setItem('userId', res.userId?.toString() ?? '0');
  }

  private requestWithToken<T>(method: string, endpoint: string, body?: any): Observable<T> {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated. Please login.');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const url = `${this.apiUrl}/admin/${endpoint}`;

    let request$: Observable<T>;
    switch (method) {
      case 'GET': request$ = this.http.get<T>(url, { headers }); break;
      case 'POST': request$ = this.http.post<T>(url, body, { headers }); break;
      case 'PUT': request$ = this.http.put<T>(url, body, { headers }); break;
      case 'DELETE': request$ = this.http.delete<T>(url, { headers }); break;
      default: throw new Error('Invalid HTTP method');
    }

    return request$.pipe(
      catchError(err => this.handleRequestError<T>(err))
    );
  }

  private handleRequestError<T>(err: any): Observable<T> {
    if (err.status === 401 || err.status === 403) {
      this.logout();
    }
    return throwError(() => err) as Observable<T>;
  }
}