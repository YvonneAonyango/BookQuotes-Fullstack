import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

export interface Stats {
  totalUsers: number;
  totalBooks: number;
  totalQuotes: number;
  adminUsers: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  stats: Stats = {
    totalUsers: 0,
    totalBooks: 0,
    totalQuotes: 0,
    adminUsers: 0
  };
  isLoading = false;
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.authService.isAdmin()) {
      this.loadStats();
    } else {
      this.errorMessage = 'Admin access required. Please login as admin.';
    }
  }

  // -----------------------
  // Reusable Admin GET helper
  // -----------------------
  private adminGet<T>(endpoint: string) {
    const token = this.authService.getToken();
    if (!token) throw new Error('Not authenticated. Please login.');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // ✅ Use only /admin/...; do NOT prepend extra /api
    return this.http.get<T>(`${environment.apiUrl}/admin/${endpoint}`, { headers });
  }

  // -----------------------
  // Load Stats
  // -----------------------
  loadStats(): void {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      this.adminGet<any>('stats').subscribe({
        next: (stats) => {
          this.stats = {
            totalUsers: stats.TotalUsers,
            totalBooks: stats.TotalBooks,
            totalQuotes: stats.TotalQuotes,
            adminUsers: stats.AdminUsers
          };
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading stats:', error);
          this.errorMessage = error.error?.message || 'Failed to load admin statistics';
          this.isLoading = false;
        }
      });
    } catch (err: any) {
      this.errorMessage = err.message;
      this.isLoading = false;
    }
  }

  isAdminUser(): boolean {
    return this.authService.isAdmin();
  }
}