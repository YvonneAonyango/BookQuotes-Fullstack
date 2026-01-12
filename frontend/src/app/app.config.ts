import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// FIX: Use provideHttpClient instead of HttpClientModule
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';

// Import your interceptor
import { AuthInterceptor } from './interceptors/auth.interceptor'; // Adjust path

// FINAL WORKING TRANSLATION LOADER
export function createTranslateLoader(http: HttpClient) {
  console.log('Creating TranslateLoader...');
  return {
    getTranslation: (lang: string) => {
      const url = `/assets/i18n/${lang}.json`;
      console.log(`Loading translation from: ${url}`);
      return http.get(url);
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Router
    provideRouter(routes),

    // FIX: Use provideHttpClient with interceptor
    provideHttpClient(
      withInterceptors([AuthInterceptor]) // <-- THIS IS CRITICAL!
    ),

    // ngx-translate
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'en',
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient]
        },
        useDefaultLang: true
      })
    )
  ]
};