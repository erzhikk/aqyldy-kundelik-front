import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotifyService } from '../ui/notify.service';

/**
 * Global Error Interceptor
 *
 * Handles HTTP errors globally with user-friendly notifications
 *
 * Error handling strategy:
 * - 401: Skip (handled by auth interceptor)
 * - 403: Access denied
 * - 404: Not found
 * - 500+: Server errors
 * - 0: Network/CORS errors
 * - Other: Generic error
 *
 * IMPORTANT: Register AFTER auth interceptor to handle errors after refresh attempts
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotifyService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: any) => {
      // Only handle HTTP errors
      if (!(error instanceof HttpErrorResponse)) {
        notify.error('Unexpected error occurred');
        return throwError(() => error);
      }

      // Skip 401 - auth interceptor handles this
      if (error.status === 401) {
        // Auth interceptor will handle refresh/redirect
        // Only show notification if we're on a protected route and refresh failed
        return throwError(() => error);
      }

      // Handle other error types
      handleHttpError(error, notify, router);

      return throwError(() => error);
    })
  );
};

/**
 * Handle different HTTP error status codes
 */
function handleHttpError(
  error: HttpErrorResponse,
  notify: NotifyService,
  router: Router
): void {
  // Try to extract backend error message
  const backendMessage = extractBackendMessage(error);

  switch (error.status) {
    case 0:
      // Network error (offline, CORS, server down)
      notify.error('Cannot connect to server. Check your connection.', 6000);
      break;

    case 403:
      // Forbidden - access denied
      notify.error(backendMessage || 'Access denied. You do not have permission.', 5000);
      // Optionally redirect to forbidden page
      // router.navigate(['/forbidden']);
      break;

    case 404:
      // Not found
      notify.error(backendMessage || 'Resource not found', 4000);
      break;

    case 409:
      // Conflict (e.g., duplicate entry)
      notify.error(backendMessage || 'Conflict: Resource already exists', 5000);
      break;

    case 422:
      // Validation error
      notify.error(backendMessage || 'Validation failed. Check your input.', 5000);
      break;

    case 429:
      // Too many requests
      notify.warning(backendMessage || 'Too many requests. Please try again later.', 6000);
      break;

    case 500:
      // Internal server error
      notify.error(backendMessage || 'Server error. Please try again later.', 6000);
      break;

    case 502:
    case 503:
    case 504:
      // Bad gateway / Service unavailable / Gateway timeout
      notify.error('Service temporarily unavailable. Please try again.', 6000);
      break;

    default:
      // Generic error for unknown status codes
      if (error.status >= 400 && error.status < 500) {
        // Client errors (4xx)
        notify.error(backendMessage || `Request failed (${error.status})`, 5000);
      } else if (error.status >= 500) {
        // Server errors (5xx)
        notify.error(backendMessage || 'Server error. Please try again later.', 6000);
      } else {
        // Unknown error
        notify.error('An unexpected error occurred', 5000);
      }
  }

  // Log to console for debugging
  console.error('[Error Interceptor]', {
    status: error.status,
    message: error.message,
    url: error.url,
    error: error.error
  });
}

/**
 * Extract user-friendly error message from backend response
 */
function extractBackendMessage(error: HttpErrorResponse): string | null {
  // Try different common backend error message formats
  if (error.error) {
    // Format 1: { message: "..." }
    if (typeof error.error.message === 'string') {
      return error.error.message;
    }

    // Format 2: { error: "..." }
    if (typeof error.error.error === 'string') {
      return error.error.error;
    }

    // Format 3: { errors: ["...", "..."] }
    if (Array.isArray(error.error.errors) && error.error.errors.length > 0) {
      return error.error.errors.join(', ');
    }

    // Format 4: Direct string
    if (typeof error.error === 'string') {
      return error.error;
    }
  }

  // Fallback to status text
  if (error.statusText && error.statusText !== 'Unknown Error') {
    return error.statusText;
  }

  return null;
}
