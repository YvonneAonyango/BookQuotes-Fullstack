import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Language = 'en' | 'sv';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private translate = inject(TranslateService);
  private currentLanguage: Language = 'en';

  constructor() {
    this.initializeLanguage();
  }

  private initializeLanguage(): void {
    // Get saved language from localStorage or browser
    const savedLang = localStorage.getItem('language') as Language;
    const browserLang = navigator.language.startsWith('sv') ? 'sv' : 'en';
    const defaultLang = savedLang || browserLang;
    
    // Set default language
    this.translate.setDefaultLang('en');
    this.setLanguage(defaultLang);
  }

  setLanguage(lang: Language): void {
    this.currentLanguage = lang;
    localStorage.setItem('language', lang);
    this.translate.use(lang);
    document.documentElement.lang = lang;
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }
}