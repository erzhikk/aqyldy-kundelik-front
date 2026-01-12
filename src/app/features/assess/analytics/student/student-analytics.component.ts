import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LastTestCardComponent } from './last-test-card.component';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Student Analytics Page
 * Main analytics dashboard for students
 */
@Component({
  standalone: true,
  selector: 'app-student-analytics',
  imports: [CommonModule, LastTestCardComponent, TranslateModule],
  template: `
    <div class="student-analytics-page">
      <div class="page-header">
        <h1 class="page-title">{{ 'ANALYTICS.STUDENT_TITLE' | translate }}</h1>
        <p class="page-subtitle">{{ 'ANALYTICS.STUDENT_SUBTITLE' | translate }}</p>
      </div>

      <div class="analytics-content">
        <app-last-test-card></app-last-test-card>
      </div>
    </div>
  `,
  styles: [`
    .student-analytics-page {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;
      padding: 20px 24px;
      background: linear-gradient(135deg, #f3f8ff 0%, #f4fff6 100%);
      border-radius: 16px;
      border: 1px solid #d6e4f0;
    }

    .page-title {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 8px 0;
    }

    .page-subtitle {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }

    .analytics-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    @media (max-width: 768px) {
      .student-analytics-page {
        padding: 1rem;
      }

      .page-title {
        font-size: 22px;
      }
    }
  `]
})
export class StudentAnalyticsComponent {}
