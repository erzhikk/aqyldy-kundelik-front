import { Injectable, signal } from '@angular/core';

/**
 * Loading Service
 *
 * Manages global loading state for HTTP requests
 * Tracks concurrent requests and shows/hides loading indicator
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  // Public signal for components to subscribe
  readonly isLoading = signal(false);

  // Track concurrent requests
  private requestCount = 0;

  /**
   * Increment request counter and show loading
   */
  show(): void {
    this.requestCount++;
    this.updateLoadingState();
  }

  /**
   * Decrement request counter and hide loading if no pending requests
   */
  hide(): void {
    this.requestCount = Math.max(0, this.requestCount - 1);
    this.updateLoadingState();
  }

  /**
   * Force hide loading (useful for error recovery)
   */
  forceHide(): void {
    this.requestCount = 0;
    this.updateLoadingState();
  }

  /**
   * Update loading state based on request count
   */
  private updateLoadingState(): void {
    this.isLoading.set(this.requestCount > 0);
  }
}
