import { Component, OnInit, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { LanguageService, Language } from '../../services/language.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  faHome,
  faGlobe,
  faSignInAlt,
  faUserPlus,
  faBars,
  faBook,
  faQuoteRight
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FontAwesomeModule,
    NgbDropdownModule,
    TranslateModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  faHome = faHome;
  faGlobe = faGlobe;
  faSignInAlt = faSignInAlt;
  faUserPlus = faUserPlus;
  faBars = faBars;
  faBook = faBook;
  faQuoteRight = faQuoteRight;

  currentLanguage: Language = 'en';
  currentFlag = '🇬🇧';
  isCollapsed = true;

  authService = inject(AuthService);
  languageService = inject(LanguageService);
  themeService = inject(ThemeService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private meta = inject(Meta);
  private titleService = inject(Title);

  isHomePage = false;

  ngOnInit(): void {
    this.currentLanguage = this.languageService.getCurrentLanguage();
    this.currentFlag = this.currentLanguage === 'en' ? '🇬🇧' : '🇸🇪';

    // Meta tags
    this.meta.updateTag({ name: 'viewport', content: 'width=device-width, initial-scale=1.0' });
    
    // Set title
    this.titleService.setTitle('Book Quotes Buddy');
    
    this.meta.updateTag({
      name: 'description',
      content: 'Your personal library companion for managing books and quotes.'
    });

    // Check initial route
    this.checkRoute(this.router.url);
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.checkRoute(event.urlAfterRedirects);
      }
    });
  }

  private checkRoute(url: string) {
    this.isHomePage = url === '/' || url === '/home';
  }

  switchLanguage(language: Language): void {
    this.currentLanguage = language;
    this.currentFlag = language === 'en' ? '🇬🇧' : '🇸🇪';
    this.languageService.setLanguage(language);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Toggle mobile menu
  toggleMenu() {
    this.isCollapsed = !this.isCollapsed;
  }
}