import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';

// Define Stats interface here since we removed AdminAuthService
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

  loadStats(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    const token = this.authService.getToken();
    if (!token) {
      this.errorMessage = 'Not authenticated. Please login.';
      this.isLoading = false;
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.get<Stats>('http://localhost:5298/api/admin/stats', { headers })
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading stats:', error);
          this.errorMessage = error.error?.message || 'Failed to load admin statistics';
          this.isLoading = false;
        }
      });
  }

  // Optional: Add a method to check if user is admin
  isAdminUser(): boolean {
    return this.authService.isAdmin();
  }
}