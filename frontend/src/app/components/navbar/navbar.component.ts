import { Component, OnInit, ViewChild, ElementRef, HostListener, inject } from '@angular/core';
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
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  @ViewChild('dropdown') dropdown!: ElementRef;

  currentLanguage: Language = 'en';
  isMobileMenuOpen = false;
  isDropdownOpen = false;

  icons = {
    home: '<i class="fas fa-house"></i>',
    en: '<i class="flag-icon flag-icon-gb"></i>',
    sv: '<i class="flag-icon flag-icon-se"></i>',
    moon: '<i class="fas fa-moon"></i>',
    sun: '<i class="fas fa-sun"></i>',
    menu: '<i class="fas fa-bars"></i>'
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
      if (event instanceof NavigationEnd) this.closeMenus();
    });
  }

  get isDarkMode(): boolean {
    return this.themeService.isDarkMode();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  switchLanguage(lang: Language): void {
    this.currentLanguage = lang;
    this.languageService.setLanguage(lang);
    this.isDropdownOpen = false;
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  closeMenus(): void {
    this.isMobileMenuOpen = false;
    this.isDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.dropdown && !this.dropdown.nativeElement.contains(target)) {
      this.isDropdownOpen = false;
    }
    if (window.innerWidth <= 768 && !target.closest('.navbar')) {
      this.isMobileMenuOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenus();
  }
}
