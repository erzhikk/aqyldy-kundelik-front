import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpEvent
} from '@angular/common/http';
import { TokenStorage } from './token-storage.service';
import { AuthService } from './auth.service';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take, finalize } from 'rxjs/operators';

// Хранилище состояния refresh (можно вынести в отдельный сервис)
class RefreshTokenHandler {
  private isRefreshing = false;
  private refreshSubject = new BehaviorSubject<string | null>(null);

  get isInProgress(): boolean {
    return this.isRefreshing;
  }

  startRefresh(): void {
    this.isRefreshing = true;
    this.refreshSubject.next(null);
  }

  finishRefresh(token: string | null): void {
    this.isRefreshing = false;
    this.refreshSubject.next(token);
  }

  waitForRefresh(): Observable<string> {
    return this.refreshSubject.pipe(
      filter((token): token is string => token !== null),
      take(1)
    );
  }

  reset(): void {
    this.isRefreshing = false;
    this.refreshSubject.next(null);
  }
}

// Singleton инстанс для хранения состояния refresh
const refreshHandler = new RefreshTokenHandler();

/**
 * Auth interceptor with automatic token refresh
 * - Adds Authorization header with access token
 * - Handles 401 errors with automatic token refresh
 * - Queues requests during token refresh
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const store = inject(TokenStorage);
  const auth = inject(AuthService);
  const router = inject(Router);

  // Пропускаем auth endpoints
  if (isAuthEndpoint(req.url)) {
    return next(req);
  }

  // Добавляем токен, если есть
  const withAuth = addAuthToken(req, store.access);

  return next(withAuth).pipe(
    catchError((err: any) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        return handle401Error(withAuth, next, store, auth, router);
      }
      return throwError(() => err);
    })
  );
};

/**
 * Проверяет, является ли URL auth endpoint'ом
 */
function isAuthEndpoint(url: string): boolean {
  const authEndpoints = ['/api/auth/login', '/api/auth/refresh', '/api/auth/register'];
  return authEndpoints.some(endpoint => url.includes(endpoint));
}

/**
 * Добавляет Authorization header с токеном
 */
function addAuthToken(req: HttpRequest<any>, token: string | null): HttpRequest<any> {
  if (!token) {
    return req;
  }

  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * Обрабатывает 401 ошибку с автоматическим refresh токена
 */
function handle401Error(
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  store: TokenStorage,
  auth: AuthService,
  router: Router
): Observable<HttpEvent<any>> {
  // Если refresh токена нет, сразу очищаем и выходим
    if (!store.refresh) {
      console.warn('[Auth Interceptor] No refresh token available, clearing session');
      store.clear();
      router.navigate(['/']);
      return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }));
    }

  // Если уже идёт refresh, ждём его завершения
  if (refreshHandler.isInProgress) {
    return refreshHandler.waitForRefresh().pipe(
      switchMap(newToken => {
        const retriedReq = addAuthToken(req, newToken);
        return next(retriedReq);
      })
    );
  }

  // Начинаем новый refresh
  refreshHandler.startRefresh();

  return auth.refresh().pipe(
    switchMap(response => {
      const newAccessToken = response.accessToken;
      refreshHandler.finishRefresh(newAccessToken);

      // Повторяем оригинальный запрос с новым токеном
      const retriedReq = addAuthToken(req, newAccessToken);
      return next(retriedReq);
    }),
    catchError(refreshError => {
      console.error('[Auth Interceptor] Token refresh failed:', refreshError);
      refreshHandler.reset();
      store.clear();
      router.navigate(['/']);

      // Можно добавить редирект на логин
      // inject(Router).navigate(['/login']);

      return throwError(() => refreshError);
    }),
    finalize(() => {
      // На всякий случай сбрасываем флаг
      if (refreshHandler.isInProgress) {
        refreshHandler.reset();
      }
    })
  );
}
