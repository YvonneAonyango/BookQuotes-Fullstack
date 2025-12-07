import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';

import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

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

    // ngx-translate (standalone-compatible)
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'en',
        loader: {
          provide: TranslateLoader,
          useFactory: (http: HttpClient) => ({
            getTranslation: (lang: string) => http.get(`./assets/i18n/${lang}.json`)
          }),
          deps: [HttpClient]
        }
      })
    )
  ]
};