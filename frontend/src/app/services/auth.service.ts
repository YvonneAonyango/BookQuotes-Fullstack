import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

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
  message: string;
}

export interface UserInfo {
  username: string;
  role: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // ✅ Updated backend URL
  private apiUrl = 'https://bookquotes-back-nxld.onrender.com/api/auth';
  private TOKEN_KEY = 'authToken';
  private USER_KEY = 'currentUser';

  private tokenSubject = new BehaviorSubject<string | null>(this.getToken());
  private userSubject = new BehaviorSubject<UserInfo | null>(this.getCurrentUser());
  private authStatusSubject = new BehaviorSubject<boolean>(this.isAuthenticated());
  private adminStatusSubject = new BehaviorSubject<boolean>(this.isAdmin());

  public token$ = this.tokenSubject.asObservable();
  public currentUser$ = this.userSubject.asObservable();
  public isAuthenticated$ = this.authStatusSubject.asObservable();
  public isAdmin$ = this.adminStatusSubject.asObservable();

  constructor(private http: HttpClient) {
    this.updateAuthStatus();
  }

  /** Login for users */
  login(user: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, user).pipe(
      tap(response => {
        this.storeAuthData(response);
        this.updateAuthStatus();
      }),
      catchError(error => throwError(() => error))
    );
  }

  /** Admin login */
  adminLogin(user: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, user).pipe( // Backend endpoint is same
      tap(response => {
        this.storeAuthData(response);
        this.updateAuthStatus();
      }),
      catchError(error => throwError(() => error))
    );
  }

  /** Register a new user */
  register(user: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, user).pipe(
      tap(response => {
        this.storeAuthData(response);
        this.updateAuthStatus();
      }),
      catchError(error => throwError(() => error))
    );
  }

  /** Logout user */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.updateAuthStatus();
  }

  /** Store token and user info */
  private storeAuthData(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    const userInfo: UserInfo = { username: response.username, role: response.role, token: response.token };
    localStorage.setItem(this.USER_KEY, JSON.stringify(userInfo));
  }

  /** Get token from storage */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /** Get current user info from storage */
  getCurrentUser(): UserInfo | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  /** Get user role */
  getUserRole(): string | null {
    return this.getCurrentUser()?.role || null;
  }

  /** Check if user is admin */
  isAdmin(): boolean {
    return this.getCurrentUser()?.role === 'Admin';
  }

  /** Check if user is authenticated */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /** Update BehaviorSubjects */
  private updateAuthStatus(): void {
    const token = this.getToken();
    const user = this.getCurrentUser();
    this.tokenSubject.next(token);
    this.userSubject.next(user);
    this.authStatusSubject.next(!!token);
    this.adminStatusSubject.next(user?.role === 'Admin');
  }
}
