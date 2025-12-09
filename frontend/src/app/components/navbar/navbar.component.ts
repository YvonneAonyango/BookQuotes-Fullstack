import { Component, OnInit, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { LanguageService, Language } from '../../services/language.service';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  currentLanguage: Language = 'en';
  isMobileMenuOpen: boolean = false;

  icons = {
    home: '🏠',
    moon: '🌙',
    sun: '☀️',
    menu: '☰'
  };

  router = inject(Router);
  authService = inject(AuthService);
  languageService = inject(LanguageService);
  themeService = inject(ThemeService);
  translate = inject(TranslateService);
  meta = inject(Meta);
  titleService = inject(Title);

  ngOnInit(): void {

    // Set current language
    this.currentLanguage = this.languageService.getCurrentLanguage();

    // Set viewport meta
    this.meta.updateTag({ name: 'viewport', content: 'width=device-width, initial-scale=1.0' });

    // Set page title from translation
    this.translate.get('brand').subscribe(t => this.titleService.setTitle(t || 'Book Quotes Buddy'));

    // Close mobile menu on navigation
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.closeMenus();
      }
    });
  }

  // -------------------- Theme --------------------
  get isDarkMode(): boolean {
    return this.themeService.isDarkMode();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  // -------------------- Language --------------------
  switchLanguage(lang: Language): void {
    this.currentLanguage = lang;
    this.languageService.setLanguage(lang);
  }

  // -------------------- Mobile Menu --------------------
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMenus(): void {
    this.isMobileMenuOpen = false;
  }

  // -------------------- Logout --------------------
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}