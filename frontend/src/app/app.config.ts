import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { HttpClientModule, HttpClient } from '@angular/common/http';
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

    // HttpClient (legacy support)
    importProvidersFrom(HttpClientModule),

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
