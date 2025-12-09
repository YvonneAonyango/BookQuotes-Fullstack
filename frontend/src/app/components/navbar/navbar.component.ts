import { Component, OnInit, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { LanguageService, Language } from '../../services/language.service';
import { TranslateService } from '@ngx-translate/core';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  currentLanguage: Language = 'en';
  currentFlag = '🇬🇧';
  isCollapsed = true;
  isHomePage = false;

  router = inject(Router);
  authService = inject(AuthService);
  languageService = inject(LanguageService);
  themeService = inject(ThemeService);
  private translate = inject(TranslateService);
  private meta = inject(Meta);
  private titleService = inject(Title);

  ngOnInit(): void {
    this.currentLanguage = this.languageService.getCurrentLanguage();
    this.currentFlag = this.currentLanguage === 'en' ? '🇬🇧' : '🇸🇪';

    // Meta tags
    this.meta.updateTag({ name: 'viewport', content: 'width=device-width, initial-scale=1.0' });

    // Set title and description dynamically
    this.translate.get('brand').subscribe((translated: string) => {
      this.titleService.setTitle(translated || 'Book Quotes Buddy');
    });
    this.translate.get('personalLibrary').subscribe((translated: string) => {
      this.meta.updateTag({
        name: 'description',
        content: translated || 'Your personal library companion for managing books and quotes.',
      });
    });

    // Detect current route
    this.checkRoute(this.router.url);
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.checkRoute(event.urlAfterRedirects);
      }
    });

    // Optional: Add subtle shadow on scroll
    window.addEventListener('scroll', () => {
      const navbar = document.querySelector('nav.navbar');
      if (window.scrollY > 10) {
        navbar?.classList.add('scrolled');
      } else {
        navbar?.classList.remove('scrolled');
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
    this.languageService.setLanguage(language);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleMenu(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}