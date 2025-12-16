import { Injectable, ApplicationRef, createComponent, EnvironmentInjector } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationConfig {
  message: string;
  type: NotificationType;
  duration?: number;
  action?: string;
}

/**
 * Notification Service
 *
 * Lightweight toast/snackbar service without Material dependency
 * Creates native-like notifications at the bottom of the screen
 *
 * Usage:
 *   notify.success('Operation completed')
 *   notify.error('Something went wrong', 5000)
 *   notify.info('FYI', { action: 'Details' })
 */
@Injectable({ providedIn: 'root' })
export class NotifyService {
  private container: HTMLElement | null = null;
  private activeNotifications = new Set<HTMLElement>();

  constructor(
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector
  ) {
    this.ensureContainer();
  }

  /**
   * Show success notification (green)
   */
  success(message: string, duration = 3000): void {
    this.show({ message, type: 'success', duration });
  }

  /**
   * Show error notification (red)
   */
  error(message: string, duration = 5000): void {
    this.show({ message, type: 'error', duration });
  }

  /**
   * Show info notification (blue)
   */
  info(message: string, duration = 3000): void {
    this.show({ message, type: 'info', duration });
  }

  /**
   * Show warning notification (orange)
   */
  warning(message: string, duration = 4000): void {
    this.show({ message, type: 'warning', duration });
  }

  /**
   * Show custom notification
   */
  show(config: NotificationConfig): void {
    if (!this.container) {
      this.ensureContainer();
    }

    const notification = this.createNotification(config);
    this.container!.appendChild(notification);
    this.activeNotifications.add(notification);

    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);

    // Auto dismiss
    if (config.duration) {
      setTimeout(() => this.dismiss(notification), config.duration);
    }
  }

  /**
   * Dismiss specific notification
   */
  private dismiss(notification: HTMLElement): void {
    notification.classList.remove('show');
    notification.classList.add('hide');

    setTimeout(() => {
      if (notification.parentElement) {
        notification.parentElement.removeChild(notification);
      }
      this.activeNotifications.delete(notification);
    }, 300);
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.activeNotifications.forEach(notification => this.dismiss(notification));
  }

  /**
   * Create notification element
   */
  private createNotification(config: NotificationConfig): HTMLElement {
    const notification = document.createElement('div');
    notification.className = `notify-toast notify-${config.type}`;

    const icon = this.getIcon(config.type);
    const action = config.action || 'OK';

    notification.innerHTML = `
      <div class="notify-icon">${icon}</div>
      <div class="notify-message">${this.escapeHtml(config.message)}</div>
      <button class="notify-action">${this.escapeHtml(action)}</button>
    `;

    // Click handler for dismiss
    const actionBtn = notification.querySelector('.notify-action') as HTMLElement;
    actionBtn?.addEventListener('click', () => this.dismiss(notification));

    return notification;
  }

  /**
   * Ensure container exists in DOM
   */
  private ensureContainer(): void {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.className = 'notify-container';
    document.body.appendChild(this.container);

    // Inject styles
    this.injectStyles();
  }

  /**
   * Get icon for notification type
   */
  private getIcon(type: NotificationType): string {
    const icons = {
      success: '✓',
      error: '✗',
      info: 'ℹ',
      warning: '⚠'
    };
    return icons[type];
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Inject CSS styles
   */
  private injectStyles(): void {
    if (document.getElementById('notify-styles')) return;

    const style = document.createElement('style');
    style.id = 'notify-styles';
    style.textContent = `
      .notify-container {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
        max-width: 500px;
        width: calc(100% - 40px);
      }

      .notify-toast {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        color: white;
        pointer-events: auto;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .notify-toast.show {
        opacity: 1;
        transform: translateY(0);
      }

      .notify-toast.hide {
        opacity: 0;
        transform: translateY(-20px);
      }

      .notify-icon {
        font-size: 20px;
        font-weight: bold;
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .notify-message {
        flex: 1;
        line-height: 1.4;
      }

      .notify-action {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        color: white;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
        flex-shrink: 0;
      }

      .notify-action:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .notify-action:active {
        background: rgba(255, 255, 255, 0.4);
      }

      .notify-success {
        background: #16a34a;
      }

      .notify-error {
        background: #dc2626;
      }

      .notify-info {
        background: #2563eb;
      }

      .notify-warning {
        background: #ea580c;
      }

      @media (max-width: 640px) {
        .notify-container {
          bottom: 10px;
          width: calc(100% - 20px);
        }

        .notify-toast {
          padding: 10px 14px;
          font-size: 13px;
        }
      }
    `;

    document.head.appendChild(style);
  }
}
