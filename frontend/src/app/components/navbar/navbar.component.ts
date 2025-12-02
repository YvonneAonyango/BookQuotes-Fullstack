import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslationService, Language } from '../../services/translation.service';
import { ThemeService } from '../../services/theme.service';
import { TranslationPipe } from '../../pipes/translation.pipe';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

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
  faPlus
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
  faPlus = faPlus;

  isMenuCollapsed = true;
  currentLanguage: Language = 'en';
  currentFlag = '🇬🇧';

  authService = inject(AuthService);
  translationService = inject(TranslationService);
  themeService = inject(ThemeService);
  private router = inject(Router);

  ngOnInit(): void {
    this.currentLanguage = this.translationService.getCurrentLanguage();
    this.currentFlag = this.currentLanguage === 'en' ? '🇬🇧' : '🇸🇪';
  }

  get isDarkMode(): boolean {
    return this.themeService.isDarkMode();
  }

  collapseMenu(): void {
    this.isMenuCollapsed = true;
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
    this.collapseMenu();
  }
}