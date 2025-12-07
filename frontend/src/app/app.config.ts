import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';

import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

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

    // HttpClient + legacy interceptors (compatible mode)
    importProvidersFrom(HttpClientModule),

    // Auth Interceptor
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },

    // ngx-translate - FINAL WORKING CONFIG
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