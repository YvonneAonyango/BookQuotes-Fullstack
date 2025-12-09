import { Component, OnInit, inject, HostListener, ViewChild, ElementRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { LanguageService, Language } from '../../services/language.service';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
  @ViewChild('dropdown') dropdown!: ElementRef;
  
  currentLanguage: Language = 'en';
  currentFlag = '🇬🇧';
  isCollapsed = true;
  showDropdown = false;
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

    // Set meta tags
    this.meta.updateTag({ name: 'viewport', content: 'width=device-width, initial-scale=1.0' });
    
    // Set title using translation
    this.translate.get('brand').subscribe((translated: string) => {
      this.titleService.setTitle(translated || 'Book Quotes Buddy');
    });
    
    this.translate.get('personalLibrary').subscribe((translated: string) => {
      this.meta.updateTag({
        name: 'description',
        content: translated || 'Your personal library companion for managing books and quotes.'
      });
    });

    // Check initial route
    this.checkRoute(this.router.url);
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.checkRoute(event.urlAfterRedirects);
      }
    });
  }

  private checkRoute(url: string): void {
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
    this.showDropdown = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleMenu(): void {
    this.isCollapsed = !this.isCollapsed;
    // Close dropdown when mobile menu toggles
    if (!this.isCollapsed) {
      this.showDropdown = false;
    }
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    // Check if click is inside dropdown
    if (this.dropdown && !this.dropdown.nativeElement.contains(target)) {
      this.showDropdown = false;
    }
    
    // Close mobile menu when clicking outside on mobile
    if (window.innerWidth <= 768 && !target.closest('.navbar-container') && !this.isCollapsed) {
      this.isCollapsed = true;
    }
  }

  // Close menu on escape key
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isCollapsed = true;
    this.showDropdown = false;
  }
}