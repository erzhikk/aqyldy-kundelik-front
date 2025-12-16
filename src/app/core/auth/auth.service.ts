import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { TokenStorage } from './token-storage.service';

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
 * Authentication service
 * Handles login, logout, token refresh, and registration
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(TokenStorage);
  private readonly baseUrl = '/api/auth';

  /**
   * Login with email and password
   */
  login(credentials: LoginRequest): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${this.baseUrl}/login`, credentials)
      .pipe(
        tap(response => this.saveTokens(response)),
        catchError(error => {
          console.error('[AuthService] Login failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Register new user
   */
  register(data: RegisterRequest): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${this.baseUrl}/register`, data)
      .pipe(
        tap(response => this.saveTokens(response)),
        catchError(error => {
          console.error('[AuthService] Registration failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Refresh access token using refresh token
   */
  refresh(): Observable<TokenResponse> {
    const refreshToken = this.store.refresh;

    if (!refreshToken) {
      console.error('[AuthService] No refresh token available');
      return throwError(() => new Error('No refresh token'));
    }

    return this.http
      .post<TokenResponse>(`${this.baseUrl}/refresh`, { refreshToken })
      .pipe(
        tap(response => this.saveTokens(response)),
        catchError(error => {
          console.error('[AuthService] Token refresh failed:', error);
          this.store.clear();
          return throwError(() => error);
        })
      );
  }

  /**
   * Logout and invalidate refresh token on server
   */
  logout(): Observable<void> {
    const refreshToken = this.store.refresh;

    if (!refreshToken) {
      // No refresh token, just clear local storage
      this.store.clear();
      return throwError(() => new Error('No refresh token'));
    }

    return this.http
      .post<void>(`${this.baseUrl}/logout`, { refreshToken })
      .pipe(
        tap(() => {
          console.log('[AuthService] Logged out successfully');
          this.store.clear();
        }),
        catchError(error => {
          console.error('[AuthService] Logout failed:', error);
          // Clear tokens even if logout request fails
          this.store.clear();
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
}
