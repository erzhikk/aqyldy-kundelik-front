import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { TokenStorage } from './token-storage.service';

/**
 * Auth Guard
 *
 * Protects routes from unauthorized access
 * - Checks if access token exists
 * - Redirects to /auth-test if not authenticated
 */
export const authGuard: CanActivateFn = (route, state) => {
  const tokens = inject(TokenStorage);
  const router = inject(Router);

  // Check if user has access token
  if (tokens.access && !tokens.isAccessExpired()) {
    return true;
  }

  // Not authenticated - redirect to auth-test page
  console.warn('Auth guard: User not authenticated, redirecting to /auth-test');
  return router.createUrlTree(['/auth-test'], {
    queryParams: { returnUrl: state.url }
  });
};

/**
 * Role Guard Factory
 *
 * Creates a guard that checks for specific roles
 * Usage: canActivate: [roleGuard(['ADMIN', 'SUPER_ADMIN'])]
 */
export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return (route, state) => {
    const tokens = inject(TokenStorage);
    const router = inject(Router);

    // First check authentication
    if (!tokens.access || tokens.isAccessExpired()) {
      return router.createUrlTree(['/auth-test']);
    }

    // Check if user has one of the allowed roles
    const userRoles = tokens.decode()?.roles ?? [];
    const hasRole = allowedRoles.some(role => userRoles.includes(role));

    if (hasRole) {
      return true;
    }

    // User doesn't have required role
    console.warn(`Role guard: User doesn't have required roles: ${allowedRoles.join(', ')}`);
    return router.createUrlTree(['/dashboard']); // Redirect to dashboard
  };
}
