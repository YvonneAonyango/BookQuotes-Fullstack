import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    const isAuthenticated = this.authService.isAuthenticated();
    const requiresGuest = route.data['requiresGuest'] || false;
    
    // If route requires guest (login/register) and user is already logged in
    if (requiresGuest && isAuthenticated) {
      return this.router.createUrlTree(['/books']);
    }
    
    // If route is protected and user is not logged in
    if (!requiresGuest && !isAuthenticated) {
      return this.router.createUrlTree(['/login']);
    }
    
    // Allow access
    return true;
  }
}