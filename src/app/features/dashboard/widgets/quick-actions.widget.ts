import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TokenStorage } from '../../../core/auth/token-storage.service';

/**
 * Quick Actions Widget
 *
 * Simple action buttons based on user roles
 * - Admins: Create user
 * - Schedule admins: Add lesson
 * - Teachers: Attendance sheet
 */
@Component({
  standalone: true,
  selector: 'app-quick-actions',
  imports: [CommonModule],
  template: `
    @if (hasQuickActions()) {
      <div class="quick-actions-card">
      <div class="quick-actions-title">Quick Actions</div>
      <div class="quick-actions-buttons">
      @if (can('ADMIN', 'SUPER_ADMIN')) {
        <button
          class="qa-btn qa-mint"
          (click)="go('/app/users')"
        >
          <span class="qa-plus">+</span>
          Create user
        </button>
      }

      @if (can('ADMIN_SCHEDULE', 'SUPER_ADMIN')) {
        <button
          class="qa-btn qa-sea"
          (click)="go('/app/timetable')"
        >
          <span class="qa-plus">+</span>
          Add lesson
        </button>
      }

      @if (can('TEACHER', 'ADMIN', 'SUPER_ADMIN')) {
        <button
          class="qa-btn qa-sage"
          (click)="go('/app/attendance')"
        >
          <span class="qa-plus">+</span>
          Attendance sheet
        </button>
      }
      </div>
    </div>
    }
  `,
  styles: [`
    .quick-actions-card {
      border-radius: 16px;
      border: 1px solid #d6e4f0;
      background: #ffffff;
      box-shadow: 0 14px 26px rgba(15, 23, 42, 0.08);
      padding: 16px 18px;
    }

    .quick-actions-title {
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 12px;
      font-size: 0.95rem;
    }

    .quick-actions-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .qa-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 999px;
      border: 1px solid rgba(15, 118, 110, 0.3);
      font-family: inherit;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
    }

    .qa-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 18px rgba(15, 118, 110, 0.2);
    }

    .qa-plus {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: rgba(15, 118, 110, 0.18);
      color: #0f5f58;
      font-weight: 700;
      line-height: 1;
    }

    .qa-mint {
      background: #e6f5f1;
      color: #0f5f58;
    }

    .qa-sea {
      background: rgba(14, 165, 164, 0.12);
      color: #0f5f58;
      border-color: rgba(14, 165, 164, 0.4);
    }

    .qa-sage {
      background: rgba(34, 197, 94, 0.12);
      color: #166534;
      border-color: rgba(34, 197, 94, 0.35);
    }
  `]
})
export class QuickActionsWidget {
  private router = inject(Router);
  private tokens = inject(TokenStorage);

  /**
   * Check if user has any of the specified roles
   */
  can(...roles: string[]): boolean {
    const payload = this.tokens.decode() as any;
    const userRoles = payload?.roles ?? [];
    return roles.some(role => userRoles.includes(role));
  }

  hasQuickActions(): boolean {
    return this.can('ADMIN', 'SUPER_ADMIN', 'ADMIN_SCHEDULE', 'TEACHER');
  }

  /**
   * Navigate to route
   */
  go(route: string): void {
    this.router.navigate([route]);
  }
}
