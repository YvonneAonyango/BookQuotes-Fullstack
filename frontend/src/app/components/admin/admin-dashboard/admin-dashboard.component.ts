import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';

export interface Stats {
  totalUsers: number;
  totalBooks: number;
  totalQuotes: number;
  adminUsers: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  stats = signal<Stats>({ totalUsers: 0, totalBooks: 0, totalQuotes: 0, adminUsers: 0 });
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    if (!this.authService.isAdmin()) {
      this.errorMessage.set('Admin access required.');
      return;
    }
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      stats: this.authService.adminGet<any>('stats').pipe(
        catchError(err => {
          console.error(err);
          this.errorMessage.set('Failed to load stats');
          return of(null as any); // Type-safe fallback
        })
      )
    }).subscribe({
      next: ({ stats }) => {
        if (stats) {
          this.stats.set({
            totalUsers: stats.TotalUsers ?? 0,
            totalBooks: stats.TotalBooks ?? 0,
            totalQuotes: stats.TotalQuotes ?? 0,
            adminUsers: stats.AdminUsers ?? 0
          });
        }
      },
      complete: () => this.isLoading.set(false)
    });
  }
}