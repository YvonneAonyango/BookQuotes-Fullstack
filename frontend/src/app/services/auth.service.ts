import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

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
  private apiUrl = environment.apiUrl;
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
    this.checkAuthStatus();
  }

  /** Login for users */
  login(user: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, user)
      .pipe(
        tap(response => {
          this.storeAuthData(response);
          this.updateAuthStatus();
        }),
        catchError(error => throwError(() => error))
      );
  }

  /** Admin login */
  adminLogin(user: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/admin/login`, user)
      .pipe(
        tap(response => {
          this.storeAuthData(response);
          this.updateAuthStatus();
        }),
        catchError(error => throwError(() => error))
      );
  }

  /** Register a new user */
  register(user: RegisterRequest): Observable<AuthResponse> {
    const registrationData = {
      username: user.username,
      password: user.password,
      confirmPassword: user.confirmPassword,
      role: user.role || 'User'
    };

    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, registrationData)
      .pipe(
        tap(response => {
          this.storeAuthData(response);
          this.updateAuthStatus();
        }),
        catchError(error => throwError(() => error))
      );
  }

  /** Setup initial admin user */
  setupAdmin(username: string, password: string, confirmPassword: string): Observable<any> {
    const setupData = { username, password, confirmPassword };
    return this.http.post<any>(`${this.apiUrl}/setup-admin`, setupData)
      .pipe(catchError(error => throwError(() => error)));
  }

  /** Store token and user info in localStorage */
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

  /** Get user role (fixes AuthGuard error) */
  getUserRole(): string | null {
    const user = this.getCurrentUser();
    return user?.role || null;
  }

  /** Check if user is admin */
  isAdmin(): boolean {
    return this.getCurrentUser()?.role === 'Admin';
  }

  /** Check if user is authenticated */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /** Check status and update BehaviorSubjects */
  private checkAuthStatus(): void {
    const token = this.getToken();
    const user = this.getCurrentUser();
    this.tokenSubject.next(token);
    this.userSubject.next(user);
    this.authStatusSubject.next(!!token);
    this.adminStatusSubject.next(user?.role === 'Admin');
  }

  /** Update BehaviorSubjects after login/register */
  private updateAuthStatus(): void {
    const token = this.getToken();
    const user = this.getCurrentUser();
    this.tokenSubject.next(token);
    this.userSubject.next(user);
    this.authStatusSubject.next(!!token);
    this.adminStatusSubject.next(user?.role === 'Admin');
  }

  /** Logout user and clear storage */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.tokenSubject.next(null);
    this.userSubject.next(null);
    this.authStatusSubject.next(false);
    this.adminStatusSubject.next(false);
  }
}
