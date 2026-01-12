import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuickActionsWidget } from './widgets/quick-actions.widget';
import { TodayLessonsWidget } from './widgets/today-lessons.widget';
import { TokenStorage } from '../../core/auth/token-storage.service';
import { LastTestCardComponent } from '../assess/analytics/student/last-test-card.component';

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
  imports: [CommonModule, QuickActionsWidget, TodayLessonsWidget, LastTestCardComponent],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <div class="dashboard-header hero">
        <div>
          <h1 class="dashboard-title">Dashboard</h1>
          <p class="dashboard-subtitle">Welcome back, {{ userName() }}</p>
        </div>
        <div class="hero-meta">Overview</div>
      </div>

      <!-- Widgets Grid -->
      <div class="grid gap-4 md:grid-cols-2">
        <!-- Quick Actions (full width) -->
        <app-quick-actions class="md:col-span-2"></app-quick-actions>

        <!-- Student Analytics Widget -->
        @if (isStudent()) {
          <app-last-test-card class="md:col-span-2"></app-last-test-card>
        }

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
      --ink: #0f172a;
      --muted: #64748b;
      --line: #d6e4f0;
      --surface: #ffffff;
      --accent: #0f766e;

      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header.hero {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 2rem;
      padding: 20px 22px;
      border-radius: 18px;
      border: 1px solid var(--line);
      background: linear-gradient(135deg, #f3f8ff 0%, #f4fff6 100%);
      box-shadow: 0 14px 26px rgba(15, 23, 42, 0.08);
      position: relative;
      overflow: hidden;
    }

    .dashboard-header.hero::after {
      content: '';
      position: absolute;
      top: -60px;
      right: -40px;
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(14, 165, 164, 0.25), rgba(14, 165, 164, 0));
      pointer-events: none;
    }

    .dashboard-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--ink);
      margin: 0 0 0.5rem 0;
    }

    .dashboard-subtitle {
      font-size: 1rem;
      color: var(--muted);
      margin: 0;
    }

    .hero-meta {
      font-size: 13px;
      color: var(--muted);
      padding: 6px 12px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.7);
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

      .dashboard-header.hero {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
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

  /**
   * Check if current user is a student
   */
  isStudent(): boolean {
    const payload = this.tokens.decode() as any;
    const roles = payload?.roles ?? [];
    return roles.includes('STUDENT');
  }
}
