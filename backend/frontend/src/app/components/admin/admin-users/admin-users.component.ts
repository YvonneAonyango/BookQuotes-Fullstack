import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

export interface User {
  id: number;
  username: string;
  role: string;
  registeredDate?: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.authService.isAdmin()) {
      this.loadUsers();
    } else {
      this.errorMessage = 'Admin access required. Please login as admin.';
    }
  }

  loadUsers(): void {
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

    // ✅ Corrected endpoint
    this.http.get<User[]>(`${environment.apiUrl}/admin/users`, { headers })
      .subscribe({
        next: (users) => {
          this.users = users;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.errorMessage = error.error?.message || 'Failed to load users';
          this.isLoading = false;
        }
      });
  }

  deleteUser(id: number): void {
    if (!id) return;

    if (!confirm('Are you sure you want to delete this user?')) return;

    const token = this.authService.getToken();
    if (!token) return;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // ✅ Corrected endpoint
    this.http.delete<void>(`${environment.apiUrl}/admin/users/${id}`, { headers })
      .subscribe({
        next: () => this.users = this.users.filter(u => u.id !== id),
        error: (error) => console.error('Error deleting user:', error)
      });
  }

  toggleUserRole(user: User): void {
    const newRole = user.role === 'Admin' ? 'User' : 'Admin';
    if (!confirm(`Change ${user.username}'s role from ${user.role} to ${newRole}?`)) return;

    const token = this.authService.getToken();
    if (!token) return;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // ✅ Corrected endpoint
    this.http.put<User>(`${environment.apiUrl}/admin/users/${user.id}/role`, { role: newRole }, { headers })
      .subscribe({
        next: (updatedUser) => {
          const index = this.users.findIndex(u => u.id === user.id);
          if (index !== -1) this.users[index] = updatedUser;
        },
        error: (error) => console.error('Error updating user role:', error)
      });
  }

  getRoleBadgeClass(role: string): string {
    return role === 'Admin' ? 'badge bg-danger' : 'badge bg-success';
  }

  isAdminUser(): boolean {
    return this.authService.isAdmin();
  }
}
