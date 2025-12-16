import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotifyService } from '../../core/ui/notify.service';

/**
 * Notification Demo Component
 * Demonstrates all notification types
 */
@Component({
  selector: 'app-notify-demo',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="notify-demo">
      <div class="header">
        <h2>🔔 Notification Service Demo</h2>
        <a routerLink="/auth-test" class="nav-link">← Back to Auth Test</a>
      </div>

      <div class="demo-section">
        <h3>Basic Notifications</h3>
        <div class="button-grid">
          <button class="btn btn-success" (click)="showSuccess()">
            Success
          </button>
          <button class="btn btn-error" (click)="showError()">
            Error
          </button>
          <button class="btn btn-info" (click)="showInfo()">
            Info
          </button>
          <button class="btn btn-warning" (click)="showWarning()">
            Warning
          </button>
        </div>
      </div>

      <div class="demo-section">
        <h3>Duration Tests</h3>
        <div class="button-grid">
          <button class="btn" (click)="showShort()">
            Short (1s)
          </button>
          <button class="btn" (click)="showMedium()">
            Medium (3s)
          </button>
          <button class="btn" (click)="showLong()">
            Long (10s)
          </button>
        </div>
      </div>

      <div class="demo-section">
        <h3>Multiple Notifications</h3>
        <div class="button-grid">
          <button class="btn" (click)="showMultiple()">
            Show 3 Notifications
          </button>
          <button class="btn btn-danger" (click)="clearAll()">
            Clear All
          </button>
        </div>
      </div>

      <div class="demo-section">
        <h3>Long Messages</h3>
        <button class="btn" (click)="showLongMessage()">
          Show Long Message
        </button>
      </div>
    </div>
  `,
  styles: [`
    .notify-demo {
      max-width: 600px;
      margin: 2rem auto;
      padding: 2rem;
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

    h3 {
      margin-bottom: 1rem;
      color: #555;
      font-size: 1.1rem;
    }

    .demo-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .button-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
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
      background: #6b7280;
      color: white;
    }

    .btn:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .btn:active {
      transform: translateY(0);
    }

    .btn-success {
      background: #16a34a;
    }

    .btn-error {
      background: #dc2626;
    }

    .btn-info {
      background: #2563eb;
    }

    .btn-warning {
      background: #ea580c;
    }

    .btn-danger {
      background: #991b1b;
    }
  `]
})
export class NotifyDemoComponent {
  private notify = inject(NotifyService);

  showSuccess(): void {
    this.notify.success('Operation completed successfully!');
  }

  showError(): void {
    this.notify.error('Something went wrong. Please try again.');
  }

  showInfo(): void {
    this.notify.info('Here is some useful information for you.');
  }

  showWarning(): void {
    this.notify.warning('Warning: This action cannot be undone.');
  }

  showShort(): void {
    this.notify.success('Quick notification', 1000);
  }

  showMedium(): void {
    this.notify.info('Medium duration notification', 3000);
  }

  showLong(): void {
    this.notify.warning('This will stay for 10 seconds', 10000);
  }

  showMultiple(): void {
    this.notify.success('First notification');
    setTimeout(() => this.notify.info('Second notification'), 500);
    setTimeout(() => this.notify.warning('Third notification'), 1000);
  }

  showLongMessage(): void {
    this.notify.info(
      'This is a much longer notification message that demonstrates how the notification system handles longer text content. It should wrap nicely and remain readable.',
      5000
    );
  }

  clearAll(): void {
    this.notify.clearAll();
  }
}
