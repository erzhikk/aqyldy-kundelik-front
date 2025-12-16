import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LoadingService } from '../../core/ui/loading.service';
import { TokenStorage } from '../../core/auth/token-storage.service';

/**
 * Quick Acceptance Test Component
 *
 * Fast manual testing of all interceptors:
 * 1. Loading indicator appears/disappears
 * 2. Error notifications show
 * 3. Auth auto-refresh on 401
 */
@Component({
  selector: 'app-acceptance-test',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="acceptance-test">
      <div class="header">
        <h1>⚡ Quick Acceptance Test</h1>
        <a routerLink="/auth-test" class="btn-back">← Back</a>
      </div>

      <!-- Loading Status -->
      <div class="status-card" [class.loading]="loading.isLoading()">
        <h3>🔄 Loading Status</h3>
        <div class="status-indicator">
          @if (loading.isLoading()) {
            <span class="badge loading">Loading...</span>
          } @else {
            <span class="badge idle">Idle</span>
          }
        </div>
      </div>

      <!-- Auth Status -->
      <div class="status-card">
        <h3>🔐 Auth Status</h3>
        <div class="auth-info">
          <div class="info-row">
            <span>Access Token:</span>
            <code>{{ hasAccessToken() ? '✓ Present' : '✗ Missing' }}</code>
          </div>
          <div class="info-row">
            <span>Refresh Token:</span>
            <code>{{ hasRefreshToken() ? '✓ Present' : '✗ Missing' }}</code>
          </div>
          <div class="info-row">
            <span>Token Expired:</span>
            <code>{{ isExpired() ? '✗ Yes' : '✓ No' }}</code>
          </div>
        </div>
      </div>

      <!-- Quick Tests -->
      <div class="test-grid">
        <!-- Test 1: Loading -->
        <div class="test-card">
          <h3>1️⃣ Loading Interceptor</h3>
          <p>Watch the spinner appear at top-right</p>
          <button class="btn btn-primary" (click)="testLoading()">
            Test Loading (3s)
          </button>
          <div class="hint">
            ✓ Spinner shows<br>
            ✓ Waits 3 seconds<br>
            ✓ Spinner hides
          </div>
        </div>

        <!-- Test 2: Error 404 -->
        <div class="test-card">
          <h3>2️⃣ Error Interceptor (404)</h3>
          <p>Expect "Resource not found" notification</p>
          <button class="btn btn-error" (click)="testError404()">
            Trigger 404 Error
          </button>
          <div class="hint">
            ✓ Red notification<br>
            ✓ "Resource not found"<br>
            ✓ Auto-dismiss in 4s
          </div>
        </div>

        <!-- Test 3: Error 500 -->
        <div class="test-card">
          <h3>3️⃣ Error Interceptor (500)</h3>
          <p>Expect "Server error" notification</p>
          <button class="btn btn-error" (click)="testError500()">
            Trigger 500 Error
          </button>
          <div class="hint">
            ✓ Red notification<br>
            ✓ "Server error"<br>
            ✓ Auto-dismiss in 6s
          </div>
        </div>

        <!-- Test 4: Auth Auto-Refresh -->
        <div class="test-card">
          <h3>4️⃣ Auth Interceptor (401)</h3>
          <p>Forces 401 to test auto-refresh</p>
          <button
            class="btn btn-warning"
            (click)="testAuth401()"
            [disabled]="!hasRefreshToken()"
          >
            Test Auto-Refresh
          </button>
          <div class="hint">
            ✓ Invalidates access token<br>
            ✓ Request gets 401<br>
            ✓ Auto-refresh triggered<br>
            ✓ Request retries
          </div>
          @if (!hasRefreshToken()) {
            <div class="warning">⚠️ Login first!</div>
          }
        </div>

        <!-- Test 5: Multiple Errors -->
        <div class="test-card">
          <h3>5️⃣ Multiple Errors</h3>
          <p>Tests error handling with multiple requests</p>
          <button class="btn btn-warning" (click)="testMultipleErrors()">
            Trigger 3 Errors
          </button>
          <div class="hint">
            ✓ 3 notifications appear<br>
            ✓ Stack properly<br>
            ✓ All dismiss
          </div>
        </div>

        <!-- Test 6: Valid Request -->
        <div class="test-card">
          <h3>6️⃣ Success Case</h3>
          <p>Tests loading + no error notification on 404</p>
          <button
            class="btn btn-success"
            (click)="testSuccess()"
          >
            Test Valid Request
          </button>
          <div class="hint">
            ✓ Spinner shows/hides<br>
            ✓ Bearer token added (if logged in)<br>
            ✓ No error notification (even on 404)
          </div>
          @if (!hasAccessToken()) {
            <div class="warning">ℹ️ Works without login, but won't have auth token</div>
          }
        </div>
      </div>

      <!-- Instructions -->
      <div class="instructions">
        <h3>📋 What to Watch</h3>
        <ul>
          <li><strong>Top-Right Corner:</strong> Loading spinner appears/disappears</li>
          <li><strong>Bottom-Center:</strong> Error notifications appear</li>
          <li><strong>Network Tab:</strong> Check requests in DevTools</li>
          <li><strong>Console:</strong> Check interceptor logs</li>
        </ul>

        <h3>✅ Acceptance Criteria</h3>
        <ol>
          <li>✓ Loading spinner shows during requests</li>
          <li>✓ Error notifications appear with correct messages</li>
          <li>✓ 401 triggers auto-refresh (if logged in)</li>
          <li>✓ All notifications auto-dismiss</li>
          <li>✓ No console errors (except expected 404/500)</li>
        </ol>

        <h3>🔍 Debug Info</h3>
        <div class="debug-info">
          <code>sessionStorage.aq_access: {{ hasAccessToken() ? 'Present' : 'Missing' }}</code><br>
          <code>localStorage.aq_refresh: {{ hasRefreshToken() ? 'Present' : 'Missing' }}</code><br>
          <code>Loading state: {{ loading.isLoading() }}</code>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .acceptance-test {
      max-width: 1200px;
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

    h1 {
      margin: 0;
      color: #333;
    }

    .btn-back {
      padding: 0.5rem 1rem;
      background: #6b7280;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .btn-back:hover {
      background: #4b5563;
    }

    .status-card {
      background: #f5f5f5;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      transition: all 0.3s;
    }

    .status-card.loading {
      background: #fef3c7;
      border: 2px solid #f59e0b;
    }

    .status-card h3 {
      margin: 0 0 1rem 0;
      color: #555;
    }

    .status-indicator {
      display: flex;
      gap: 1rem;
    }

    .badge {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .badge.loading {
      background: #f59e0b;
      color: white;
      animation: pulse 1.5s ease-in-out infinite;
    }

    .badge.idle {
      background: #10b981;
      color: white;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    .auth-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .info-row span {
      font-weight: 500;
    }

    .info-row code {
      background: white;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .test-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .test-card {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
      transition: all 0.2s;
    }

    .test-card:hover {
      border-color: #2563eb;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .test-card h3 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .test-card p {
      color: #666;
      font-size: 0.875rem;
      margin: 0 0 1rem 0;
    }

    .btn {
      width: 100%;
      padding: 0.75rem;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 0.75rem;
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #2563eb;
      color: white;
    }

    .btn-success {
      background: #10b981;
      color: white;
    }

    .btn-error {
      background: #ef4444;
      color: white;
    }

    .btn-warning {
      background: #f59e0b;
      color: white;
    }

    .hint {
      background: #f9fafb;
      padding: 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      color: #666;
      line-height: 1.6;
    }

    .warning {
      background: #fef3c7;
      color: #92400e;
      padding: 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      margin-top: 0.5rem;
      text-align: center;
    }

    .instructions {
      background: #eff6ff;
      padding: 2rem;
      border-radius: 8px;
      border-left: 4px solid #2563eb;
    }

    .instructions h3 {
      color: #1e40af;
      margin-top: 0;
    }

    .instructions ul, .instructions ol {
      color: #555;
      line-height: 1.8;
    }

    .instructions li {
      margin-bottom: 0.5rem;
    }

    .instructions strong {
      color: #2563eb;
    }

    .debug-info {
      background: #f9fafb;
      padding: 1rem;
      border-radius: 4px;
      margin-top: 1rem;
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
    }

    .debug-info code {
      display: block;
      margin: 0.25rem 0;
    }
  `]
})
export class AcceptanceTestComponent {
  private http = inject(HttpClient);
  private storage = inject(TokenStorage);
  protected loading = inject(LoadingService);

  // Signals for reactive UI
  hasAccessToken = signal(false);
  hasRefreshToken = signal(false);
  isExpired = signal(false);

  constructor() {
    this.updateStatus();
    // Update every second
    setInterval(() => this.updateStatus(), 1000);
  }

  private updateStatus(): void {
    this.hasAccessToken.set(!!this.storage.access);
    this.hasRefreshToken.set(!!this.storage.refresh);
    this.isExpired.set(this.storage.isAccessExpired());
  }

  /**
   * Test 1: Loading Interceptor
   * Should show spinner for 3 seconds
   */
  testLoading(): void {
    console.log('🧪 Test: Loading Interceptor');

    // Make a slow request (will likely 404, but that's ok)
    this.http.get('/api/test/slow?delay=3000').subscribe({
      next: () => console.log('✓ Request completed'),
      error: (err) => console.log('✓ Request completed with error:', err.status)
    });
  }

  /**
   * Test 2: Error Interceptor - 404
   * Should show "Resource not found" notification
   */
  testError404(): void {
    console.log('🧪 Test: Error 404');

    this.http.get('/api/nonexistent/resource/12345').subscribe({
      error: (err) => console.log('✓ Got expected 404:', err.status)
    });
  }

  /**
   * Test 3: Error Interceptor - 500
   * Should show "Server error" notification
   */
  testError500(): void {
    console.log('🧪 Test: Error 500');

    // Try to trigger 500 (may not work depending on backend)
    this.http.post('/api/invalid/endpoint/that/causes/error', {
      invalid: 'data',
      nested: { bad: 'structure' }
    }).subscribe({
      error: (err) => console.log('✓ Got error:', err.status)
    });
  }

  /**
   * Test 4: Auth Interceptor - 401 Auto-Refresh
   * Should:
   * 1. Invalidate access token
   * 2. Make request → 401
   * 3. Auto-refresh
   * 4. Retry request
   */
  testAuth401(): void {
    console.log('🧪 Test: Auth Auto-Refresh on 401');

    if (!this.storage.refresh) {
      console.error('✗ No refresh token - login first!');
      return;
    }

    // Invalidate access token
    console.log('1. Invalidating access token...');
    this.storage.access = 'invalid_expired_token';
    this.updateStatus();

    // Make a protected request
    console.log('2. Making request with invalid token...');
    this.http.get('/api/test/protected').subscribe({
      next: (response) => {
        console.log('✓ Success after auto-refresh!');
        console.log('Response:', response);
        this.updateStatus();
      },
      error: (err) => {
        console.error('✗ Failed:', err.status);
        if (err.status === 401) {
          console.error('Auth interceptor did not refresh token');
        }
        this.updateStatus();
      }
    });
  }

  /**
   * Test 5: Multiple Errors
   * Should show 3 stacked notifications
   */
  testMultipleErrors(): void {
    console.log('🧪 Test: Multiple Errors');

    // Fire 3 errors with delays
    setTimeout(() => {
      console.log('Error 1/3...');
      this.http.get('/api/error/1').subscribe();
    }, 100);

    setTimeout(() => {
      console.log('Error 2/3...');
      this.http.get('/api/error/2').subscribe();
    }, 600);

    setTimeout(() => {
      console.log('Error 3/3...');
      this.http.get('/api/error/3').subscribe();
    }, 1200);
  }

  /**
   * Test 6: Success Case
   * Tests loading + error handling on 404 (should NOT show notification)
   */
  testSuccess(): void {
    console.log('🧪 Test: Valid Request');

    if (!this.storage.access) {
      console.warn('⚠️ No access token - request will be made without Authorization header');
    } else {
      console.log('✓ Access token present - will add Authorization header');
    }

    this.http.get('/api/test/success').subscribe({
      next: (response) => {
        console.log('✓ Success:', response);
      },
      error: (err) => {
        console.log('✓ Request completed (got expected 404)');
        console.log('Status:', err.status);
        console.log('IMPORTANT: Should NOT see red notification! 404 is expected.');
      }
    });
  }
}
