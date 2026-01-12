import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideEcharts } from 'ngx-echarts';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { loadingInterceptor, errorInterceptor } from './core/http';

// Factory function for translation loader
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

/**
 * Application Configuration
 *
 * IMPORTANT: Interceptor order matters!
 * 1. loadingInterceptor  - Show/hide loading indicator
 * 2. authInterceptor     - Add auth token + auto-refresh on 401
 * 3. errorInterceptor    - Handle errors globally (after auth refresh attempts)
 *
 * Request flow:  loading → auth → backend
 * Response flow: backend → auth (refresh if 401) → error → loading
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),

    // HTTP client with interceptors (order matters!)
    provideHttpClient(
      withInterceptors([
        loadingInterceptor,  // 1. Track loading state
        authInterceptor,     // 2. Auth + auto-refresh
        errorInterceptor     // 3. Global error handling
      ])
    ),

    // i18n Translation module
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'ru',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    ),
    provideEcharts()
  ]
};
