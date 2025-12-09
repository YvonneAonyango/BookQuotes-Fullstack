import { Component, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { LanguageService, Language } from '../../services/language.service';
import { Meta, Title } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  currentLanguage: Language = 'en';
  isMobileMenuOpen = false;
  private destroy$ = new Subject<void>();

  // Auth status properties
  isLoggedIn = false;
  isAdmin = false;

  router = inject(Router);
  authService = inject(AuthService);
  languageService = inject(LanguageService);
  themeService = inject(ThemeService);
  translate = inject(TranslateService);
  meta = inject(Meta);
  titleService = inject(Title);

  ngOnInit(): void {
    this.currentLanguage = this.languageService.getCurrentLanguage();
    this.meta.updateTag({ name: 'viewport', content: 'width=device-width, initial-scale=1.0' });
    this.translate.get('brand').subscribe(t => this.titleService.setTitle(t || 'Book Quotes Buddy'));

    // Initialize auth status using isAuthenticated()
    this.updateAuthStatus();

    this.router.events
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => { 
        if (event instanceof NavigationEnd) {
          this.closeOnNavigate();
          // Re-check auth status on navigation
          this.updateAuthStatus();
        }
      });
  }

  ngOnDestroy(): void { 
    this.destroy$.next(); 
    this.destroy$.complete(); 
  }

  // UPDATE THIS METHOD: Use isAuthenticated() instead of isLoggedIn()
  private updateAuthStatus(): void {
    this.isLoggedIn = this.authService.isAuthenticated(); // ✅ Using isAuthenticated()
    this.isAdmin = this.authService.isAdmin();
  }

  get isDarkMode(): boolean { 
    return this.themeService.isDarkMode(); 
  }

  toggleDarkMode(): void { 
    this.themeService.toggleTheme(); 
  }

  toggleLanguage(): void {
    const newLang = this.currentLanguage === 'en' ? 'sv' : 'en';
    this.currentLanguage = newLang;
    this.languageService.setLanguage(newLang);
  }

  toggleMobileMenu(): void { 
    this.isMobileMenuOpen = !this.isMobileMenuOpen; 
  }

  closeOnNavigate(): void { 
    this.isMobileMenuOpen = false; 
  }

  logout(): void {
    this.authService.logout();
    this.isLoggedIn = false; // Update immediately
    this.isAdmin = false; // Update immediately
    this.router.navigate(['/login']);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { 
    this.isMobileMenuOpen = false; 
  }
}