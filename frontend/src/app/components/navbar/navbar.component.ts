import { Component, OnInit, ViewChild, ElementRef, HostListener, inject } from '@angular/core';
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
  isCollapsed = true;
  showDropdown = false;

  flagEn: string = '🇬🇧';
  flagSv: string = '🇸🇪';

  router = inject(Router);
  authService = inject(AuthService);
  languageService = inject(LanguageService);
  themeService = inject(ThemeService);
  private translate = inject(TranslateService);
  private meta = inject(Meta);
  private titleService = inject(Title);

  ngOnInit(): void {
    this.currentLanguage = this.languageService.getCurrentLanguage();

    this.meta.updateTag({ name: 'viewport', content: 'width=device-width, initial-scale=1.0' });
    this.translate.get('brand').subscribe(t => this.titleService.setTitle(t || 'Book Quotes Buddy'));

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) this.isCollapsed = true;
    });
  }

  get isDarkMode(): boolean {
    return this.themeService.isDarkMode();
  }

  toggleDarkMode(): void {
    this.themeService.toggleTheme();
  }

  switchLanguage(language: Language): void {
    this.currentLanguage = language;
    this.languageService.setLanguage(language);
    this.showDropdown = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleMenu(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  closeOnNavigate(): void {
    this.isCollapsed = true;
    this.showDropdown = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.dropdown && !this.dropdown.nativeElement.contains(target)) {
      this.showDropdown = false;
    }
    if (window.innerWidth <= 768 && !target.closest('.warm-navbar')) {
      this.isCollapsed = true;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isCollapsed = true;
    this.showDropdown = false;
  }
}
