import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NotifyService } from '../../core/ui/notify.service';
import { LoadingService } from '../../core/ui/loading.service';

/**
 * Interceptor Test Component
 *
 * Tests all HTTP interceptors:
 * 1. Loading Interceptor - Shows/hides loading indicator
 * 2. Auth Interceptor - Adds auth token, auto-refresh on 401
 * 3. Error Interceptor - Global error handling with notifications
 */
@Component({
  selector: 'app-interceptor-test',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="interceptor-test">
      <div class="header">
        <h2>🔌 Interceptor Testing</h2>
        <a routerLink="/auth-test" class="nav-link">← Back to Auth Test</a>
      </div>

      <div class="loading-status">
        <h3>Loading Status</h3>
        <div class="status-badge" [class.active]="loading.isLoading()">
          {{ loading.isLoading() ? '🔄 Loading...' : '✓ Idle' }}
        </div>
      </div>

      <!-- Error Interceptor Tests -->
      <div class="test-section">
        <h3>Error Interceptor Tests</h3>
        <p class="description">
          These tests trigger different HTTP errors to verify the error interceptor
          shows appropriate notifications.
        </p>

        <div class="button-grid">
          <button class="btn" (click)="test400()">
            400 Bad Request
          </button>
          <button class="btn" (click)="test403()">
            403 Forbidden
          </button>
          <button class="btn" (click)="test404()">
            404 Not Found
          </button>
          <button class="btn" (click)="test409()">
            409 Conflict
          </button>
          <button class="btn" (click)="test422()">
            422 Validation Error
          </button>
          <button class="btn" (click)="test429()">
            429 Too Many Requests
          </button>
          <button class="btn" (click)="test500()">
            500 Server Error
          </button>
          <button class="btn" (click)="test503()">
            503 Service Unavailable
          </button>
        </div>
      </div>

      <!-- Loading Interceptor Tests -->
      <div class="test-section">
        <h3>Loading Interceptor Tests</h3>
        <p class="description">
          Watch the loading indicator at the top-right of the screen.
        </p>

        <div class="button-grid">
          <button class="btn btn-primary" (click)="testFastRequest()">
            Fast Request (500ms)
          </button>
          <button class="btn btn-primary" (click)="testSlowRequest()">
            Slow Request (3s)
          </button>
          <button class="btn btn-primary" (click)="testMultipleRequests()">
            Multiple Concurrent
          </button>
          <button class="btn btn-secondary" (click)="testSkipLoading()">
            Skip Loading (Silent)
          </button>
        </div>
      </div>

      <!-- Combined Tests -->
      <div class="test-section">
        <h3>Combined Interceptor Tests</h3>

        <div class="button-grid">
          <button class="btn btn-warning" (click)="testSlowThenError()">
            Slow + Error
          </button>
          <button class="btn btn-warning" (click)="testMultipleErrors()">
            Multiple Errors
          </button>
        </div>
      </div>

      <!-- Instructions -->
      <div class="instructions">
        <h3>What to Watch</h3>
        <ul>
          <li><strong>Loading Indicator:</strong> Appears on top when requests are in progress</li>
          <li><strong>Notifications:</strong> Error messages appear at the bottom</li>
          <li><strong>Console:</strong> Check browser console for detailed logs</li>
          <li><strong>Network Tab:</strong> Verify interceptors modify requests/responses</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .interceptor-test {
      max-width: 800px;
      margin: 2rem auto;
      padding: 2rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    h2 {
      margin: 0;
      color: #333;
    }

    h3 {
      color: #555;
      margin-bottom: 1rem;
    }

    .nav-link {
      padding: 0.5rem 1rem;
      background: #6b7280;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-size: 0.875rem;
      transition: background 0.2s;
    }

    .nav-link:hover {
      background: #4b5563;
    }

    .loading-status {
      background: #f5f5f5;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }

    .status-badge {
      display: inline-block;
      padding: 0.5rem 1rem;
      background: #10b981;
      color: white;
      border-radius: 6px;
      font-weight: 500;
      margin-top: 0.5rem;
    }

    .status-badge.active {
      background: #f59e0b;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .test-section {
      background: white;
      padding: 1.5rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .description {
      color: #666;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .button-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 0.75rem;
    }

    .btn {
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      background: #ef4444;
      color: white;
    }

    .btn:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .btn:active {
      transform: translateY(0);
    }

    .btn-primary {
      background: #2563eb;
    }

    .btn-secondary {
      background: #6b7280;
    }

    .btn-warning {
      background: #f59e0b;
    }

    .instructions {
      background: #eff6ff;
      padding: 1.5rem;
      border-radius: 8px;
      border-left: 4px solid #2563eb;
    }

    .instructions ul {
      margin: 0.5rem 0 0 1.5rem;
      color: #555;
    }

    .instructions li {
      margin-bottom: 0.5rem;
    }

    .instructions strong {
      color: #2563eb;
    }
  `]
})
export class InterceptorTestComponent {
  private http = inject(HttpClient);
  private notify = inject(NotifyService);
  protected loading = inject(LoadingService);

  // Mock backend URL (will fail, which is what we want for testing)
  private readonly mockApi = '/api/mock';

  // Error tests
  test400(): void {
    this.http.get(`${this.mockApi}/400`).subscribe();
  }

  test403(): void {
    this.http.get(`${this.mockApi}/403`).subscribe();
  }

  test404(): void {
    this.http.get(`${this.mockApi}/404`).subscribe();
  }

  test409(): void {
    this.http.post(`${this.mockApi}/409`, {}).subscribe();
  }

  test422(): void {
    this.http.post(`${this.mockApi}/422`, { invalid: 'data' }).subscribe();
  }

  test429(): void {
    this.http.get(`${this.mockApi}/429`).subscribe();
  }

  test500(): void {
    this.http.get(`${this.mockApi}/500`).subscribe();
  }

  test503(): void {
    this.http.get(`${this.mockApi}/503`).subscribe();
  }

  // Loading tests
  testFastRequest(): void {
    // Simulate fast request (will likely 404, but that's ok)
    this.http.get('/api/test/fast').subscribe();
    this.notify.info('Making fast request...', 1500);
  }

  testSlowRequest(): void {
    // Simulate slow request
    this.http.get('/api/test/slow?delay=3000').subscribe();
    this.notify.info('Making slow request (3s)...', 3500);
  }

  testMultipleRequests(): void {
    // Make multiple concurrent requests
    this.notify.info('Making 5 concurrent requests...', 2000);

    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.http.get(`/api/test/request-${i}`).subscribe();
      }, i * 200);
    }
  }

  testSkipLoading(): void {
    // Request that skips loading indicator
    this.http.get('/api/test/silent', {
      headers: { 'X-Skip-Loading': 'true' }
    }).subscribe();

    this.notify.info('Silent request (no loading indicator)', 2000);
  }

  // Combined tests
  testSlowThenError(): void {
    this.notify.info('Slow request that will fail...', 2000);

    setTimeout(() => {
      this.http.get('/api/test/slow-error').subscribe();
    }, 1000);
  }

  testMultipleErrors(): void {
    this.notify.warning('Triggering multiple errors...', 2000);

    setTimeout(() => this.http.get(`${this.mockApi}/404`).subscribe(), 100);
    setTimeout(() => this.http.get(`${this.mockApi}/500`).subscribe(), 600);
    setTimeout(() => this.http.get(`${this.mockApi}/403`).subscribe(), 1200);
  }
}
