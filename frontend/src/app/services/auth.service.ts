import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  confirmPassword: string;
  role?: string; // Added optional role
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
  private apiUrl = 'http://localhost:5298/api/auth';
  private TOKEN_KEY = 'authToken';
  private USER_KEY = 'currentUser';
  
  // BehaviorSubjects for reactive state management
  private tokenSubject = new BehaviorSubject<string | null>(this.getToken());
  private userSubject = new BehaviorSubject<UserInfo | null>(this.getCurrentUser());
  private authStatusSubject = new BehaviorSubject<boolean>(this.isAuthenticated());
  private adminStatusSubject = new BehaviorSubject<boolean>(this.isAdmin());

  // Observables for components to subscribe to
  public token$ = this.tokenSubject.asObservable();
  public currentUser$ = this.userSubject.asObservable();
  public isAuthenticated$ = this.authStatusSubject.asObservable();
  public isAdmin$ = this.adminStatusSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check localStorage on service initialization
    this.checkAuthStatus();
  }

  /**
   * Login for regular users
   */
  login(user: LoginRequest): Observable<AuthResponse> {
    console.log('🔍 AuthService: Login attempt for', user.username);
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, user)
      .pipe(
        tap(response => {
          console.log('🔍 Login response:', response);
          console.log('🔍 Token received:', response.token ? 'YES' : 'NO');
          console.log('🔍 User role:', response.role);
          
          this.storeAuthData(response);
          this.updateAuthStatus();
          
          console.log('✅ AuthService: Login successful');
          this.debugTokens();
        }),
        catchError(error => {
          console.error('❌ AuthService: Login error:', error);
          console.error('Status:', error.status);
          console.error('Message:', error.error?.message || error.message);
          return throwError(() => error);
        })
      );
  }

  /**
   * Admin login using admin-specific endpoint
   */
  adminLogin(user: LoginRequest): Observable<AuthResponse> {
    console.log('🔍 AuthService: Admin login attempt for', user.username);
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/admin/login`, user)
      .pipe(
        tap(response => {
          console.log('🔍 Admin login response:', response);
          
          if (response.role !== 'Admin') {
            console.warn('⚠️ User is not an admin, role:', response.role);
            // Optional: You could throw an error here if role must be Admin
          }
          
          this.storeAuthData(response);
          this.updateAuthStatus();
          
          console.log('✅ AuthService: Admin login successful');
          this.debugTokens();
        }),
        catchError(error => {
          console.error('❌ Admin login error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Register new user with optional role
   */
  register(user: RegisterRequest): Observable<AuthResponse> {
    console.log('🔍 AuthService: Registration attempt for', user.username);
    console.log('🔍 Registration role:', user.role || 'User (default)');
    
    // Ensure role is set (default to 'User')
    const registrationData = {
      username: user.username,
      password: user.password,
      confirmPassword: user.confirmPassword,
      role: user.role || 'User'
    };
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, registrationData)
      .pipe(
        tap(response => {
          console.log('✅ Registration successful');
          console.log('🔍 User registered with role:', response.role);
          this.storeAuthData(response);
          this.updateAuthStatus();
        }),
        catchError(error => {
          console.error('❌ Registration error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Register admin user (convenience method)
   */
  registerAdmin(username: string, password: string, confirmPassword: string): Observable<AuthResponse> {
    return this.register({
      username,
      password,
      confirmPassword,
      role: 'Admin'
    });
  }

  /**
   * Setup admin user using setup-admin endpoint (for initial admin setup)
   */
  setupAdmin(username: string, password: string, confirmPassword: string): Observable<any> {
    console.log('🔍 AuthService: Setting up admin user:', username);
    
    const setupData = {
      username,
      password,
      confirmPassword
    };
    
    return this.http.post<any>(`${this.apiUrl}/setup-admin`, setupData)
      .pipe(
        tap(response => {
          console.log('✅ Admin setup successful:', response.message);
        }),
        catchError(error => {
          console.error('❌ Admin setup error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Store authentication data in localStorage
   */
  private storeAuthData(response: AuthResponse): void {
    // Store token
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem('token', response.token); // For compatibility
    
    // Store user info
    const userInfo: UserInfo = {
      username: response.username,
      role: response.role,
      token: response.token
    };
    localStorage.setItem(this.USER_KEY, JSON.stringify(userInfo));
    
    // Also store username and role separately for quick access
    localStorage.setItem('username', response.username);
    localStorage.setItem('role', response.role);
    
    console.log('💾 Auth data stored:', userInfo);
  }

  /**
   * Check authentication status on service init
   */
  private checkAuthStatus(): void {
    const token = this.getToken();
    const user = this.getCurrentUser();
    
    console.log('🔄 AuthService: Checking auth status');
    console.log('   Token exists:', !!token);
    console.log('   User exists:', !!user);
    console.log('   User role:', user?.role || 'None');
    
    this.tokenSubject.next(token);
    this.userSubject.next(user);
    this.authStatusSubject.next(!!token);
    this.adminStatusSubject.next(user?.role === 'Admin');
  }

  /**
   * Update all auth status observables
   */
  private updateAuthStatus(): void {
    const token = this.getToken();
    const user = this.getCurrentUser();
    
    this.tokenSubject.next(token);
    this.userSubject.next(user);
    this.authStatusSubject.next(!!token);
    this.adminStatusSubject.next(user?.role === 'Admin');
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    // Check primary key first, then fallbacks
    const token = localStorage.getItem(this.TOKEN_KEY) || 
                  localStorage.getItem('token');
    return token;
  }

  /**
   * Get current user info
   */
  getCurrentUser(): UserInfo | null {
    try {
      const userJson = localStorage.getItem(this.USER_KEY);
      if (!userJson) {
        // Try to reconstruct from separate storage
        const username = localStorage.getItem('username');
        const role = localStorage.getItem('role');
        const token = this.getToken();
        
        if (username && role && token) {
          const userInfo: UserInfo = { username, role, token };
          localStorage.setItem(this.USER_KEY, JSON.stringify(userInfo));
          return userInfo;
        }
        return null;
      }
      return JSON.parse(userJson);
    } catch (error) {
      console.error('Error parsing user info:', error);
      return null;
    }
  }

  /**
   * Check if current user is Admin
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    const isAdmin = user?.role === 'Admin';
    console.log('🔍 Checking admin status:', user?.role, '=>', isAdmin);
    return isAdmin;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const isAuth = !!token;
    console.log('🔍 Checking auth status:', isAuth);
    return isAuth;
  }

  /**
   * Get username for display
   */
  getUsername(): string | null {
    const user = this.getCurrentUser();
    return user?.username || localStorage.getItem('username');
  }

  /**
   * Get user role
   */
  getUserRole(): string | null {
    const user = this.getCurrentUser();
    return user?.role || localStorage.getItem('role');
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  /**
   * Logout - clear all auth data
   */
  logout(): void {
    console.log('🔍 AuthService: Logging out');
    
    // Remove all auth-related data
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('token');
    localStorage.removeItem('bookapp_token');
    localStorage.removeItem('quotesTest');
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    
    // Clear subjects
    this.tokenSubject.next(null);
    this.userSubject.next(null);
    this.authStatusSubject.next(false);
    this.adminStatusSubject.next(false);
    
    console.log('✅ AuthService: Logged out, localStorage cleared');
  }

  /**
   * Validate token with backend
   */
  validateToken(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No token found'));
    }
    
    return this.http.post(`${this.apiUrl}/validate-token`, { token })
      .pipe(
        catchError(error => {
          console.error('Token validation failed:', error);
          this.logout(); // Auto logout if token is invalid
          return throwError(() => error);
        })
      );
  }

  /**
   * Get auth headers for HTTP requests
   */
  getAuthHeaders(contentType: boolean = false): HttpHeaders {
    const token = this.getToken();
    
    if (!token) {
      return new HttpHeaders();
    }
    
    if (contentType) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Debug method to check stored tokens
   */
  debugTokens(): void {
    console.log('=== AuthService Debug ===');
    console.log('Primary token (authToken):', 
      localStorage.getItem('authToken') ? 'Present' : 'Missing');
    console.log('Secondary token (token):', 
      localStorage.getItem('token') ? 'Present' : 'Missing');
    
    const user = this.getCurrentUser();
    console.log('Current user:', user ? `${user.username} (${user.role})` : 'None');
    
    console.log('Is authenticated:', this.isAuthenticated());
    console.log('Is admin:', this.isAdmin());
    console.log('Separate storage - username:', localStorage.getItem('username'));
    console.log('Separate storage - role:', localStorage.getItem('role'));
    console.log('=========================');
  }

  /**
   * Simulate auto-login for development
   */
  autoLogin(): void {
    const token = this.getToken();
    if (token) {
      console.log('🔄 AuthService: Auto-login detected');
      this.updateAuthStatus();
    }
  }

  /**
   * Check if a route requires admin access
   */
  canAccessAdminRoute(): boolean {
    return this.isAuthenticated() && this.isAdmin();
  }

  /**
   * Check if user can access a protected route
   */
  canAccessProtectedRoute(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Clear all stored auth data (for testing)
   */
  clearAllAuthData(): void {
    console.log('🧹 Clearing ALL auth data for testing');
    
    // List all possible auth keys and remove them
    const authKeys = [
      'authToken', 'token', 'bookapp_token', 'quotesTest',
      'currentUser', 'username', 'role'
    ];
    
    authKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Reset subjects
    this.tokenSubject.next(null);
    this.userSubject.next(null);
    this.authStatusSubject.next(false);
    this.adminStatusSubject.next(false);
    
    console.log('✅ All auth data cleared');
  }

  /**
   * Check if user exists (using backend API)
   */
  checkUserExists(username: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/check/${username}`)
      .pipe(
        catchError(error => {
          console.error('Error checking user:', error);
          return throwError(() => error);
        })
      );
  }
}