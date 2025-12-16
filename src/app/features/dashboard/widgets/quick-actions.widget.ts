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
    <div class="p-4 border rounded-2xl flex flex-wrap gap-2">
      @if (can('ADMIN', 'SUPER_ADMIN')) {
        <button
          class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          (click)="go('/app/users')"
        >
          + Create user
        </button>
      }

      @if (can('ADMIN_SCHEDULE', 'SUPER_ADMIN')) {
        <button
          class="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          (click)="go('/app/timetable')"
        >
          + Add lesson
        </button>
      }

      @if (can('TEACHER', 'ADMIN', 'SUPER_ADMIN')) {
        <button
          class="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
          (click)="go('/app/attendance')"
        >
          + Attendance sheet
        </button>
      }
    </div>
  `,
  styles: [`
    .p-4 {
      padding: 1rem;
    }

    .border {
      border: 1px solid #e5e7eb;
    }

    .rounded-2xl {
      border-radius: 1rem;
    }

    .flex {
      display: flex;
    }

    .flex-wrap {
      flex-wrap: wrap;
    }

    .gap-2 {
      gap: 0.5rem;
    }

    button {
      font-family: inherit;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
    }

    .px-3 {
      padding-left: 0.75rem;
      padding-right: 0.75rem;
    }

    .py-2 {
      padding-top: 0.5rem;
      padding-bottom: 0.5rem;
    }

    .bg-blue-600 {
      background-color: #2563eb;
    }

    .bg-indigo-600 {
      background-color: #4f46e5;
    }

    .bg-emerald-600 {
      background-color: #059669;
    }

    .text-white {
      color: white;
    }

    .rounded {
      border-radius: 0.375rem;
    }

    .hover\\:bg-blue-700:hover {
      background-color: #1d4ed8;
    }

    .hover\\:bg-indigo-700:hover {
      background-color: #4338ca;
    }

    .hover\\:bg-emerald-700:hover {
      background-color: #047857;
    }

    .transition-colors {
      transition: background-color 0.2s;
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

  /**
   * Navigate to route
   */
  go(route: string): void {
    this.router.navigate([route]);
  }
}
