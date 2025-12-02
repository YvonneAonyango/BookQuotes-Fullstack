import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiresGuest = route.data['requiresGuest'] || false;
    const isAuthenticated = this.authService.isAuthenticated();
    
    console.log('🔒 AuthGuard checking:');
    console.log('  - Route:', route.routeConfig?.path);
    console.log('  - Requires guest:', requiresGuest);
    console.log('  - Is authenticated:', isAuthenticated);
    
    // If route requires guest (login/register pages)
    if (requiresGuest) {
      if (isAuthenticated) {
        // Already logged in, redirect to appropriate page
        const userRole = this.authService.getUserRole();
        if (userRole === 'Admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/books']);
        }
        return false;
      }
      return true; // Allow access to login/register if not authenticated
    }
    
    // If route requires authentication
    if (!isAuthenticated) {
      console.log('❌ Not authenticated, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }
    
    console.log('✅ Access granted');
    return true;
  }
}