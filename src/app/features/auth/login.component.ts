import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <h1>Ақылды Күнделік</h1>
        <p class="subtitle">Войдите в систему</p>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <!-- Email Field -->
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="admin@local"
              [class.error]="email?.invalid && email?.touched"
            />
            <div class="error-message" *ngIf="email?.invalid && email?.touched">
              <span *ngIf="email?.errors?.['required']">Email обязателен</span>
              <span *ngIf="email?.errors?.['email']">Введите корректный email</span>
            </div>
          </div>

          <!-- Password Field -->
          <div class="form-group">
            <label for="password">Пароль</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="••••••••"
              [class.error]="password?.invalid && password?.touched"
            />
            <div class="error-message" *ngIf="password?.invalid && password?.touched">
              <span *ngIf="password?.errors?.['required']">Пароль обязателен</span>
            </div>
          </div>

          <!-- Server Error -->
          <div class="error-message server-error" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="btn-primary"
            [disabled]="loginForm.invalid || loading"
          >
            <span *ngIf="!loading">Войти</span>
            <span *ngIf="loading">Загрузка...</span>
          </button>
        </form>

        <p class="hint">
          Тестовые данные: <strong>admin&#64;local</strong> / <strong>admin123</strong>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .login-card {
      background: white;
      padding: 2.5rem;
      border-radius: 1rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      width: 100%;
      max-width: 420px;
    }

    h1 {
      font-size: 1.75rem;
      margin-bottom: 0.25rem;
      color: #1f2937;
      text-align: center;
    }

    .subtitle {
      color: #6b7280;
      margin-bottom: 2rem;
      text-align: center;
      font-size: 0.875rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 1rem;
      transition: all 0.2s;
      box-sizing: border-box;
    }

    input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    input.error {
      border-color: #ef4444;
    }

    .error-message {
      color: #ef4444;
      font-size: 0.75rem;
      margin-top: 0.5rem;
    }

    .server-error {
      background: #fee2e2;
      color: #dc2626;
      padding: 0.75rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }

    .btn-primary {
      width: 100%;
      background: #667eea;
      color: white;
      padding: 0.875rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary:hover:not(:disabled) {
      background: #5568d3;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn-primary:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .hint {
      margin-top: 1.5rem;
      text-align: center;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .hint strong {
      color: #374151;
    }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  loginForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    // If already authenticated, redirect to /app
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/app']);
    }
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const credentials = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('[LoginComponent] ✓ Login successful!', response);
        this.loading = false;

        console.log('[LoginComponent] Navigating to /app...');
        this.router.navigate(['/app']).then(
          success => console.log('[LoginComponent] Navigation success:', success),
          error => console.error('[LoginComponent] Navigation error:', error)
        );
      },
      error: (error) => {
        this.loading = false;
        console.error('[LoginComponent] Login failed:', error);

        if (error.status === 401) {
          this.errorMessage = 'Неверный email или пароль';
        } else if (error.status === 0) {
          this.errorMessage = 'Не удалось подключиться к серверу. Проверьте, что backend запущен.';
        } else {
          this.errorMessage = error.error?.message || 'Произошла ошибка при входе';
        }
      }
    });
  }
}
