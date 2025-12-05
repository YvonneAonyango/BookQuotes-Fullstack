import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    console.log('👑 AdminGuard checking:');
    console.log('  - Is authenticated:', this.authService.isAuthenticated());
    console.log('  - Is admin:', this.authService.isAdmin());
    
    // First check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      console.log('❌ Not authenticated, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }
    
    // Then check if user is admin
    if (!this.authService.isAdmin()) {
      console.log('❌ Not an admin, redirecting to books');
      this.router.navigate(['/books']);
      return false;
    }
    
    console.log('✅ Admin access granted');
    return true;
  }
}