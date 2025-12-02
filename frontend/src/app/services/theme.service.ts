import { Injectable, signal, computed, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentTheme = signal<Theme>('light');
  
  public isDarkMode = computed(() => this.currentTheme() === 'dark');

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.loadThemePreference();
    this.setupSystemThemeListener();
  }

  private loadThemePreference(): void {
    const savedTheme = localStorage.getItem('theme') as Theme;
    
    if (savedTheme) {
      this.currentTheme.set(savedTheme);
    } else {
      // Check system preference
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme.set(isSystemDark ? 'dark' : 'light');
    }
    
    this.applyTheme();
  }

  private setupSystemThemeListener(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const listener = () => {
      if (!localStorage.getItem('theme')) {
        const isSystemDark = mediaQuery.matches;
        this.currentTheme.set(isSystemDark ? 'dark' : 'light');
        this.applyTheme();
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
    } else {
      mediaQuery.addListener(listener);
    }
  }

  toggleTheme(): void {
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.currentTheme.set(newTheme);
    this.applyTheme();
    localStorage.setItem('theme', newTheme);
  }

  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    this.applyTheme();
    localStorage.setItem('theme', theme);
  }

  private applyTheme(): void {
    const body = this.document.body;
    const html = this.document.documentElement;
    
    if (this.currentTheme() === 'dark') {
      body.classList.add('dark-mode');
      body.classList.remove('light-mode');
      html.setAttribute('data-theme', 'dark');
    } else {
      body.classList.add('light-mode');
      body.classList.remove('dark-mode');
      html.setAttribute('data-theme', 'light');
    }
  }

  getCurrentTheme(): Theme {
    return this.currentTheme();
  }
}