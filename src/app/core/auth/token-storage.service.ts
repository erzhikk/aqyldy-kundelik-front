import { Injectable } from '@angular/core';

export interface JwtPayload {
  sub: string;
  exp: number;
  uid: string;
  roles: string[];
}

/**
 * Service for managing JWT tokens in browser storage
 * - Access token stored in sessionStorage (cleared on tab close)
 * - Refresh token stored in localStorage (persists)
 */
@Injectable({ providedIn: 'root' })
export class TokenStorage {
  private readonly accessKey = 'aq_access';
  private readonly refreshKey = 'aq_refresh';

  get access(): string | null {
    return sessionStorage.getItem(this.accessKey);
  }

  set access(value: string | null) {
    if (value) {
      sessionStorage.setItem(this.accessKey, value);
    } else {
      sessionStorage.removeItem(this.accessKey);
    }
  }

  get refresh(): string | null {
    return localStorage.getItem(this.refreshKey);
  }

  set refresh(value: string | null) {
    if (value) {
      localStorage.setItem(this.refreshKey, value);
    } else {
      localStorage.removeItem(this.refreshKey);
    }
  }

  /**
   * Clear all stored tokens
   */
  clear(): void {
    this.access = null;
    this.refresh = null;
  }

  /**
   * Decode JWT token payload
   * @returns Decoded payload or null if invalid
   */
  decode(): JwtPayload | null {
    const token = this.access;
    if (!token) {
      return null;
    }

    try {
      // Manual JWT decode (no library needed)
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        return null;
      }

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload) as JwtPayload;
    } catch (error) {
      console.error('[TokenStorage] Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Check if access token is expired
   * @param offsetSec Buffer time in seconds before actual expiration (default: 10s)
   * @returns true if token is expired or will expire within offset time
   */
  isAccessExpired(offsetSec = 10): boolean {
    const payload = this.decode();

    if (!payload?.exp) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    return payload.exp < (now + offsetSec);
  }

  /**
   * Get user ID from token
   */
  getUserId(): string | null {
    return this.decode()?.uid ?? null;
  }

  /**
   * Get user roles from token
   */
  getRoles(): string[] {
    return this.decode()?.roles ?? [];
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }
}
