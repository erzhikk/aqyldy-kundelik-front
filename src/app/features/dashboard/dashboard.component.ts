import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuickActionsWidget } from './widgets/quick-actions.widget';
import { TodayLessonsWidget } from './widgets/today-lessons.widget';
import { TokenStorage } from '../../core/auth/token-storage.service';

/**
 * Dashboard Page (Container)
 *
 * Main dashboard with role-based widgets:
 * - Quick Actions (all users)
 * - Today's Lessons (teachers only)
 * - Future widgets (stats, alerts, etc.)
 */
@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule, QuickActionsWidget, TodayLessonsWidget],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <div class="dashboard-header">
        <h1 class="dashboard-title">Dashboard</h1>
        <p class="dashboard-subtitle">Welcome back, {{ userName() }}</p>
      </div>

      <!-- Widgets Grid -->
      <div class="grid gap-4 md:grid-cols-2">
        <!-- Quick Actions (full width) -->
        <app-quick-actions class="md:col-span-2"></app-quick-actions>

        <!-- Today's Lessons (teachers only) -->
        @if (isTeacher()) {
          <app-today-lessons [teacherId]="uid()"></app-today-lessons>
        }

        <!-- Placeholder for future widgets -->
        <div class="widget-placeholder">
          <div class="placeholder-header">
            <span class="placeholder-icon">📊</span>
            <div class="font-semibold">Stats / Alerts</div>
          </div>
          <div class="placeholder-body">
            <p class="text-gray-500 text-sm">Coming soon...</p>
            <ul class="placeholder-list">
              <li>Student performance stats</li>
              <li>Upcoming deadlines</li>
              <li>System notifications</li>
              <li>Recent activities</li>
            </ul>
          </div>
        </div>

        <!-- Another placeholder -->
        @if (!isTeacher()) {
          <div class="widget-placeholder">
            <div class="placeholder-header">
              <span class="placeholder-icon">📅</span>
              <div class="font-semibold">Schedule Overview</div>
            </div>
            <div class="placeholder-body">
              <p class="text-gray-500 text-sm">Your schedule will appear here</p>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      margin-bottom: 2rem;
    }

    .dashboard-title {
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 0.5rem 0;
    }

    .dashboard-subtitle {
      font-size: 1rem;
      color: #6b7280;
      margin: 0;
    }

    .grid {
      display: grid;
    }

    .gap-4 {
      gap: 1rem;
    }

    @media (min-width: 768px) {
      .md\\:grid-cols-2 {
        grid-template-columns: repeat(2, 1fr);
      }

      .md\\:col-span-2 {
        grid-column: span 2 / span 2;
      }
    }

    .widget-placeholder {
      background: white;
      border: 2px dashed #e5e7eb;
      border-radius: 1rem;
      padding: 1.5rem;
      transition: all 0.2s;
    }

    .widget-placeholder:hover {
      border-color: #d1d5db;
      background: #fafafa;
    }

    .placeholder-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      font-size: 1.125rem;
      color: #374151;
    }

    .placeholder-icon {
      font-size: 1.5rem;
    }

    .placeholder-body {
      padding-left: 2.25rem;
    }

    .placeholder-list {
      list-style: disc;
      margin: 0.75rem 0 0 1.5rem;
      color: #9ca3af;
      font-size: 0.875rem;
    }

    .placeholder-list li {
      margin-bottom: 0.25rem;
    }

    .font-semibold {
      font-weight: 600;
    }

    .text-gray-500 {
      color: #6b7280;
    }

    .text-sm {
      font-size: 0.875rem;
    }

    /* Responsive */
    @media (max-width: 767px) {
      .dashboard-container {
        padding: 1rem;
      }

      .dashboard-title {
        font-size: 1.5rem;
      }

      .grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent {
  private tokens = inject(TokenStorage);

  /**
   * Get user's full name from token
   */
  userName = computed(() => {
    const payload = this.tokens.decode() as any;
    return payload?.fullName || payload?.email || 'User';
  });

  /**
   * Get current user ID
   */
  uid = computed(() => {
    const payload = this.tokens.decode() as any;
    return payload?.sub || '';
  });

  /**
   * Check if current user is a teacher
   */
  isTeacher(): boolean {
    const payload = this.tokens.decode() as any;
    const roles = payload?.roles ?? [];
    return roles.includes('TEACHER');
  }
}
