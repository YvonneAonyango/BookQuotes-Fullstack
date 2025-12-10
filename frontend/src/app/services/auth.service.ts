import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

// AUTH MODELS
export interface LoginRequest { username: string; password: string; }
export interface RegisterRequest { username: string; password: string; confirmPassword: string; }
export interface AuthResponse { token: string; username: string; role: string; userId: number; message?: string; }

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
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, data).pipe(
      tap(res => this.storeAuthData(res)),
      catchError(err => throwError(() => err))
    );
  }

  adminLogin(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/admin/login`, data).pipe(
      tap(res => {
        if (res.role.toLowerCase() !== 'admin') throw new Error('Admin privileges required');
        this.storeAuthData(res);
      }),
      catchError(err => throwError(() => err))
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data).pipe(
      tap(res => this.storeAuthData(res)),
      catchError(err => throwError(() => err))
    );
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  validateToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) return of(false);

    return this.http.post<{ valid: boolean }>(`${this.apiUrl}/auth/validate-token`, { token }).pipe(
      map(res => res.valid),
      catchError(() => { this.logout(); return of(false); })
    );
  }

  getUserInfo(): Observable<AuthResponse | null> {
    const token = this.getToken();
    if (!token) return of(null);

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
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
      case 'GET': return this.http.get<T>(url, { headers }).pipe(catchError(err => throwError(() => err)));
      case 'POST': return this.http.post<T>(url, body, { headers }).pipe(catchError(err => throwError(() => err)));
      case 'PUT': return this.http.put<T>(url, body, { headers }).pipe(catchError(err => throwError(() => err)));
      case 'DELETE': return this.http.delete<T>(url, { headers }).pipe(catchError(err => throwError(() => err)));
    }
  }

  private storeAuthData(res: AuthResponse): void {
    if (!res) return;
    localStorage.setItem('authToken', res.token);
    localStorage.setItem('username', res.username);
    localStorage.setItem('role', res.role.toLowerCase());
    localStorage.setItem('userId', res.userId?.toString() ?? '0');
  }
}