import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { TokenStorage } from './token-storage.service';
import { NotifyService } from '../ui/notify.service';

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Authentication service with UI notifications
 * Extends base auth with user-friendly toast notifications
 *
 * To use this version instead of the basic one:
 * 1. Import this service instead of auth.service.ts
 * 2. Or add NotifyService to your existing AuthService
 */
@Injectable({ providedIn: 'root' })
export class AuthWithNotifyService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(TokenStorage);
  private readonly notify = inject(NotifyService);
  private readonly baseUrl = '/api/auth';

  /**
   * Login with email and password
   */
  login(credentials: LoginRequest, showNotifications = true): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${this.baseUrl}/login`, credentials)
      .pipe(
        tap(response => {
          this.saveTokens(response);
          if (showNotifications) {
            this.notify.success('Successfully logged in!');
          }
        }),
        catchError(error => {
          if (showNotifications) {
            this.notify.error(this.getErrorMessage(error, 'Login failed'));
          }
          console.error('[AuthService] Login failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Register new user
   */
  register(data: RegisterRequest, showNotifications = true): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${this.baseUrl}/register`, data)
      .pipe(
        tap(response => {
          this.saveTokens(response);
          if (showNotifications) {
            this.notify.success('Account created successfully!');
          }
        }),
        catchError(error => {
          if (showNotifications) {
            this.notify.error(this.getErrorMessage(error, 'Registration failed'));
          }
          console.error('[AuthService] Registration failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Refresh access token using refresh token
   * Note: Usually called by interceptor, so notifications are disabled by default
   */
  refresh(showNotifications = false): Observable<TokenResponse> {
    const refreshToken = this.store.refresh;

    if (!refreshToken) {
      console.error('[AuthService] No refresh token available');
      if (showNotifications) {
        this.notify.error('Session expired. Please login again.');
      }
      return throwError(() => new Error('No refresh token'));
    }

    return this.http
      .post<TokenResponse>(`${this.baseUrl}/refresh`, { refreshToken })
      .pipe(
        tap(response => {
          this.saveTokens(response);
          if (showNotifications) {
            this.notify.info('Session refreshed');
          }
        }),
        catchError(error => {
          this.store.clear();
          if (showNotifications) {
            this.notify.error('Session expired. Please login again.');
          }
          console.error('[AuthService] Token refresh failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Logout and invalidate refresh token on server
   */
  logout(showNotifications = true): Observable<void> {
    const refreshToken = this.store.refresh;

    if (!refreshToken) {
      this.store.clear();
      if (showNotifications) {
        this.notify.info('Logged out');
      }
      return throwError(() => new Error('No refresh token'));
    }

    return this.http
      .post<void>(`${this.baseUrl}/logout`, { refreshToken })
      .pipe(
        tap(() => {
          this.store.clear();
          if (showNotifications) {
            this.notify.success('Logged out successfully');
          }
          console.log('[AuthService] Logged out successfully');
        }),
        catchError(error => {
          // Clear tokens even if logout request fails
          this.store.clear();
          if (showNotifications) {
            this.notify.warning('Logged out (with errors)');
          }
          console.error('[AuthService] Logout failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Check if user is authenticated (has valid tokens)
   */
  isAuthenticated(): boolean {
    return !!this.store.access && !!this.store.refresh;
  }

  /**
   * Check if current user has specific role
   */
  hasRole(role: string): boolean {
    return this.store.hasRole(role);
  }

  /**
   * Get current user ID from token
   */
  getCurrentUserId(): string | null {
    return this.store.getUserId();
  }

  /**
   * Save tokens to storage
   */
  private saveTokens(response: TokenResponse): void {
    this.store.access = response.accessToken;
    this.store.refresh = response.refreshToken;
  }

  /**
   * Extract user-friendly error message
   */
  private getErrorMessage(error: any, defaultMessage: string): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    if (error?.status === 401) {
      return 'Invalid credentials';
    }
    if (error?.status === 403) {
      return 'Access denied';
    }
    if (error?.status === 0) {
      return 'Cannot connect to server';
    }
    return defaultMessage;
  }
}
