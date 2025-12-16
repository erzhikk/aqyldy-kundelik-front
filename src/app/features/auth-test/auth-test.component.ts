import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, TokenStorage } from '../../core/auth';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  timestamp?: Date;
}

/**
 * Auth Test Component - для тестирования системы аутентификации
 *
 * Проверяет:
 * 1. Login → токены сохраняются
 * 2. Защищённый запрос с Authorization header
 * 3. Auto-refresh при 401
 * 4. Logout → очистка токенов
 */
@Component({
  selector: 'app-auth-test',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-test-container">
      <div class="header">
        <h1>🔐 Auth System Test</h1>
        <div class="nav-links">
          <a routerLink="/acceptance" class="nav-link">⚡ Quick Test</a>
          <a routerLink="/notify-demo" class="nav-link">🔔 Notifications</a>
          <a routerLink="/interceptor-test" class="nav-link">🔌 Interceptors</a>
        </div>
      </div>

      <!-- Status Panel -->
      <div class="status-panel">
        <h3>Current Status</h3>
        <div class="status-grid">
          <div class="status-item">
            <strong>Access Token:</strong>
            <code>{{ accessToken() ? '✓ Present' : '✗ Missing' }}</code>
          </div>
          <div class="status-item">
            <strong>Refresh Token:</strong>
            <code>{{ refreshToken() ? '✓ Present' : '✗ Missing' }}</code>
          </div>
          <div class="status-item">
            <strong>User ID:</strong>
            <code>{{ userId() || 'N/A' }}</code>
          </div>
          <div class="status-item">
            <strong>Roles:</strong>
            <code>{{ roles() }}</code>
          </div>
          <div class="status-item">
            <strong>Token Expired:</strong>
            <code>{{ isExpired() ? '✗ Yes' : '✓ No' }}</code>
          </div>
        </div>
      </div>

      <!-- Login Form -->
      <div class="test-section">
        <h3>1. Login Test</h3>
        <div class="form-group">
          <label>Email:</label>
          <input
            type="email"
            [(ngModel)]="email"
            placeholder="admin@local"
            [disabled]="isLoading()"
          />
        </div>
        <div class="form-group">
          <label>Password:</label>
          <input
            type="password"
            [(ngModel)]="password"
            placeholder="admin123"
            [disabled]="isLoading()"
          />
        </div>
        <button
          (click)="testLogin()"
          [disabled]="isLoading()"
          class="btn-primary"
        >
          Login
        </button>
      </div>

      <!-- Protected Request Test -->
      <div class="test-section">
        <h3>2. Protected Request Test</h3>
        <p>Отправляет GET /api/test/protected с Authorization header</p>
        <button
          (click)="testProtectedRequest()"
          [disabled]="isLoading() || !accessToken()"
          class="btn-secondary"
        >
          Test Protected Request
        </button>
      </div>

      <!-- Force 401 Test -->
      <div class="test-section">
        <h3>3. Auto-Refresh Test (Force 401)</h3>
        <p>Сбрасывает access token, чтобы вызвать 401 и проверить auto-refresh</p>
        <button
          (click)="testAutoRefresh()"
          [disabled]="isLoading() || !refreshToken()"
          class="btn-warning"
        >
          Force 401 & Test Refresh
        </button>
      </div>

      <!-- Logout Test -->
      <div class="test-section">
        <h3>4. Logout Test</h3>
        <button
          (click)="testLogout()"
          [disabled]="isLoading() || !refreshToken()"
          class="btn-danger"
        >
          Logout
        </button>
      </div>

      <!-- Test Results -->
      <div class="results-section">
        <h3>Test Results</h3>
        <div class="results-list">
          @for (result of testResults(); track result.timestamp) {
            <div class="result-item" [class]="result.status">
              <span class="result-icon">
                @if (result.status === 'success') { ✓ }
                @else if (result.status === 'error') { ✗ }
                @else { ⏳ }
              </span>
              <div class="result-content">
                <strong>{{ result.name }}</strong>
                @if (result.message) {
                  <p>{{ result.message }}</p>
                }
                @if (result.timestamp) {
                  <small>{{ result.timestamp | date:'HH:mm:ss.SSS' }}</small>
                }
              </div>
            </div>
          }
        </div>
        @if (testResults().length > 0) {
          <button (click)="clearResults()" class="btn-link">Clear Results</button>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-test-container {
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
      flex-wrap: wrap;
      gap: 1rem;
    }

    h1 { color: #333; margin: 0; }
    h3 { color: #555; margin-top: 0; }

    .nav-links {
      display: flex;
      gap: 0.5rem;
    }

    .nav-link {
      padding: 0.5rem 1rem;
      background: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-size: 0.875rem;
      transition: background 0.2s;
    }

    .nav-link:hover {
      background: #1d4ed8;
    }

    .status-panel {
      background: #f5f5f5;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }

    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .status-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .status-item code {
      background: white;
      padding: 0.5rem;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .test-section {
      background: white;
      padding: 1.5rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .form-group input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-warning {
      background: #ffc107;
      color: #000;
    }

    .btn-danger {
      background: #dc3545;
      color: white;
    }

    .btn-link {
      background: transparent;
      color: #007bff;
      text-decoration: underline;
    }

    .results-section {
      margin-top: 2rem;
      padding: 1.5rem;
      background: #f9f9f9;
      border-radius: 8px;
    }

    .results-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin: 1rem 0;
    }

    .result-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border-radius: 4px;
      background: white;
      border-left: 4px solid #ccc;
    }

    .result-item.success {
      border-left-color: #28a745;
    }

    .result-item.error {
      border-left-color: #dc3545;
    }

    .result-icon {
      font-size: 1.5rem;
    }

    .result-content {
      flex: 1;
    }

    .result-content p {
      margin: 0.25rem 0;
      color: #666;
      font-size: 0.875rem;
    }

    .result-content small {
      color: #999;
      font-size: 0.75rem;
    }
  `]
})
export class AuthTestComponent {
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private storage = inject(TokenStorage);

  // Form fields
  email = 'admin@local';
  password = 'admin123';

  // Signals for reactive UI
  isLoading = signal(false);
  testResults = signal<TestResult[]>([]);
  accessToken = signal<string | null>(null);
  refreshToken = signal<string | null>(null);
  userId = signal<string | null>(null);
  roles = signal<string>('');
  isExpired = signal<boolean>(false);

  constructor() {
    this.updateTokenStatus();
    // Update status every second
    setInterval(() => this.updateTokenStatus(), 1000);
  }

  private updateTokenStatus(): void {
    this.accessToken.set(this.storage.access);
    this.refreshToken.set(this.storage.refresh);
    this.userId.set(this.storage.getUserId());
    this.roles.set(this.storage.getRoles().join(', ') || 'None');
    this.isExpired.set(this.storage.isAccessExpired());
  }

  private addResult(name: string, status: 'success' | 'error', message?: string): void {
    this.testResults.update(results => [
      { name, status, message, timestamp: new Date() },
      ...results
    ]);
  }

  testLogin(): void {
    this.isLoading.set(true);

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        this.addResult(
          'Login',
          'success',
          `Tokens received. Access token: ${response.accessToken.substring(0, 20)}...`
        );
        this.updateTokenStatus();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.addResult('Login', 'error', error.message || 'Login failed');
        this.isLoading.set(false);
      }
    });
  }

  testProtectedRequest(): void {
    this.isLoading.set(true);

    this.http.get('/api/test/protected').subscribe({
      next: (response: any) => {
        this.addResult(
          'Protected Request',
          'success',
          `Response: ${JSON.stringify(response)}`
        );
        this.isLoading.set(false);
      },
      error: (error) => {
        this.addResult(
          'Protected Request',
          'error',
          `${error.status}: ${error.message}`
        );
        this.isLoading.set(false);
      }
    });
  }

  testAutoRefresh(): void {
    // Force invalidate access token
    this.storage.access = 'invalid_token';
    this.updateTokenStatus();

    this.addResult('Auto Refresh', 'success', 'Access token invalidated, making request...');

    this.isLoading.set(true);

    this.http.get('/api/test/protected').subscribe({
      next: (response: any) => {
        this.addResult(
          'Auto Refresh',
          'success',
          `Token refreshed successfully! Response: ${JSON.stringify(response)}`
        );
        this.updateTokenStatus();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.addResult(
          'Auto Refresh',
          'error',
          `Refresh failed: ${error.message}`
        );
        this.isLoading.set(false);
      }
    });
  }

  testLogout(): void {
    this.isLoading.set(true);

    this.auth.logout().subscribe({
      next: () => {
        this.addResult('Logout', 'success', 'Tokens cleared');
        this.updateTokenStatus();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.addResult('Logout', 'error', error.message);
        this.updateTokenStatus();
        this.isLoading.set(false);
      }
    });
  }

  clearResults(): void {
    this.testResults.set([]);
  }
}
