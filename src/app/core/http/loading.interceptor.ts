import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';
import { LoadingService } from '../ui/loading.service';

/**
 * Loading Interceptor
 *
 * Shows/hides global loading indicator during HTTP requests
 *
 * Features:
 * - Tracks concurrent requests
 * - Auto-hide when all requests complete
 * - Optional per-request opt-out via headers
 *
 * Usage:
 *   // Skip loading for specific request
 *   http.get('/api/data', {
 *     headers: { 'X-Skip-Loading': 'true' }
 *   })
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);

  // Check if loading should be skipped for this request
  const skipLoading = req.headers.has('X-Skip-Loading');

  if (!skipLoading) {
    loading.show();
  }

  return next(req).pipe(
    finalize(() => {
      if (!skipLoading) {
        loading.hide();
      }
    })
  );
};
