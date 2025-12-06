import { Component, OnInit, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslationService, Language } from '../../services/translation.service';
import { ThemeService } from '../../services/theme.service';
import { TranslationPipe } from '../../pipes/translation.pipe';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { Meta, Title } from '@angular/platform-browser';

import {
  faBook,
  faQuoteLeft,
  faSun,
  faMoon,
  faSignOutAlt,
  faHome,
  faGlobe,
  faSignInAlt,
  faUserPlus,
  faHeart
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FontAwesomeModule,
    NgbDropdownModule,
    TranslationPipe
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  faBook = faBook;
  faQuoteLeft = faQuoteLeft;
  faSun = faSun;
  faMoon = faMoon;
  faSignOutAlt = faSignOutAlt;
  faHome = faHome;
  faGlobe = faGlobe;
  faSignInAlt = faSignInAlt;
  faUserPlus = faUserPlus;
  faHeart = faHeart;

  currentLanguage: Language = 'en';
  currentFlag = '🇬🇧';

  authService = inject(AuthService);
  translationService = inject(TranslationService);
  themeService = inject(ThemeService);
  private router = inject(Router);

  private meta = inject(Meta);
  private titleService = inject(Title);

  isHomePage = false;

  ngOnInit(): void {
    this.currentLanguage = this.translationService.getCurrentLanguage();
    this.currentFlag = this.currentLanguage === 'en' ? '🇬🇧' : '🇸🇪';

    // Updated viewport meta tag - removed restrictive settings
    this.meta.updateTag({
      name: 'viewport',
      content: 'width=device-width, initial-scale=1.0'
    });

    this.titleService.setTitle('BookWebApp');
    this.meta.updateTag({
      name: 'description',
      content: 'BookWebApp - Manage your personal library with books and quotes.'
    });

    // Set initial route
    this.checkRoute(this.router.url);

    // Listen to route changes
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.checkRoute(event.urlAfterRedirects);
      }
    });
  }

  private checkRoute(url: string) {
    this.isHomePage = url === '/' || url === '/home';
  }

  get isDarkMode(): boolean {
    return this.themeService.isDarkMode();
  }

  toggleDarkMode(): void {
    this.themeService.toggleTheme();
  }

  switchLanguage(language: Language): void {
    this.currentLanguage = language;
    this.currentFlag = language === 'en' ? '🇬🇧' : '🇸🇪';
    this.translationService.setLanguage(language);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}