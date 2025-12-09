import { Component, OnInit, HostListener, inject } from '@angular/core';
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
  showLanguageDropdown: boolean = false;

  icons = {
    home: '🏠',
    moon: '🌙',
    sun: '☀️',
    menu: '☰',
    ukFlag: '🇬🇧',
    seFlag: '🇸🇪'
  };

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

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.closeOnNavigate();
      }
    });
  }

  get isDarkMode(): boolean {
    return this.themeService.isDarkMode();
  }

  toggleDarkMode(): void {
    this.themeService.toggleTheme();
  }

  switchLanguage(lang: Language): void {
    this.currentLanguage = lang;
    this.languageService.setLanguage(lang);
    this.showLanguageDropdown = false;
  }

  toggleLanguageDropdown(): void {
    this.showLanguageDropdown = !this.showLanguageDropdown;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.showLanguageDropdown = false;
  }

  closeOnNavigate(): void {
    this.isMobileMenuOpen = false;
    this.showLanguageDropdown = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest('.language-dropdown')) {
      this.showLanguageDropdown = false;
    }
    if (window.innerWidth <= 768 && !(event.target as HTMLElement).closest('.navbar')) {
      this.isMobileMenuOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isMobileMenuOpen = false;
    this.showLanguageDropdown = false;
  }
}