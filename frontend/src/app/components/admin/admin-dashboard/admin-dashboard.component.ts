import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';
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
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.adminRequest<Stats>('GET', 'stats').pipe(
      catchError(err => {
        console.error('Error loading stats', err);
        this.errorMessage.set('Failed to load dashboard stats.');
        return of({ totalUsers: 0, totalBooks: 0, totalQuotes: 0, adminUsers: 0 });
      })
    ).subscribe(res => {
      this.stats.set(res);
      this.isLoading.set(false);
    });
  }
}