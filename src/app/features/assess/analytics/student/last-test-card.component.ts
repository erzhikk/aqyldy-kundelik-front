import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AnalyticsService, AttemptSummaryDto } from '../analytics.service';
import { NotifyService } from '../../../../core/ui/notify.service';

/**
 * Last Test Card Component
 * Level 1: Shows summaries of student's graded tests
 */
@Component({
  standalone: true,
  selector: 'app-last-test-card',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    TranslateModule
  ],
  template: `
    <mat-card class="last-test-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>assessment</mat-icon>
          {{ 'ANALYTICS.LAST_TEST_TITLE' | translate }}
        </mat-card-title>
      </mat-card-header>

      <mat-card-content>
        @if (loading()) {
          <div class="loading-state">
            <mat-progress-spinner mode="indeterminate" diameter="40"></mat-progress-spinner>
            <p>{{ 'ANALYTICS.LAST_TEST_LOADING' | translate }}</p>
          </div>
        }

        @if (!loading() && summaries().length === 0) {
          <div class="empty-state">
            <mat-icon>inbox</mat-icon>
            <p>{{ 'ANALYTICS.LAST_TEST_EMPTY' | translate }}</p>
            <span class="empty-hint">
              {{ 'ANALYTICS.LAST_TEST_EMPTY_HINT' | translate }}
            </span>
          </div>
        }

        @if (summaries().length > 0) {
          <div class="test-list">
            @for (attempt of summaries(); track attempt.attemptId) {
              <div class="test-summary">
                <!-- Test Header -->
                <div class="test-header">
                  <div class="test-info">
                    <h3 class="test-name">
                      {{ 'ANALYTICS.TEST_NAME_LABEL' | translate }} {{ attempt.testName }}
                    </h3>
                    @if (getSubjectName(attempt)) {
                      <p class="subject-name">
                        {{ 'ANALYTICS.SUBJECT_NAME_LABEL' | translate }} {{ getSubjectName(attempt) }}
                      </p>
                    }
                    <p class="completed-date">{{ formatDate(attempt.attemptDate) }}</p>
                  </div>
                  <div
                    class="score-badge"
                    [class.excellent]="isExcellent(attempt.percent)"
                    [class.good]="isGood(attempt.percent)"
                    [class.needs-work]="needsWork(attempt.percent)"
                  >
                    <span class="percentage">{{ attempt.percent }}%</span>
                    <span class="score-text">{{ attempt.correctAnswers }} / {{ attempt.totalQuestions }}</span>
                  </div>
                </div>

                <!-- Strong Topics -->
                @if (attempt.strongTopics.length > 0) {
                  <div class="topics-section">
                    <h4 class="section-title">
                      <mat-icon class="success-icon">check_circle</mat-icon>
                      {{ 'ANALYTICS.STRONG_AREAS' | translate }}
                    </h4>
                    <mat-chip-set class="topics-chips">
                      @for (topic of attempt.strongTopics; track topic) {
                        <mat-chip class="strong-chip">{{ topic }}</mat-chip>
                      }
                    </mat-chip-set>
                  </div>
                }

                <!-- Weak Topics -->
                @if (attempt.weakTopics.length > 0) {
                  <div class="topics-section">
                    <h4 class="section-title">
                      <mat-icon class="warning-icon">warning</mat-icon>
                      {{ 'ANALYTICS.WEAK_AREAS' | translate }}
                    </h4>
                    <mat-chip-set class="topics-chips">
                      @for (topic of attempt.weakTopics; track topic) {
                        <mat-chip class="weak-chip">{{ topic }}</mat-chip>
                      }
                    </mat-chip-set>
                  </div>
                }

                <!-- CTA Button -->
                <div class="actions">
                  <button mat-raised-button color="primary" (click)="openDetails(attempt.attemptId)">
                    <mat-icon>analytics</mat-icon>
                    {{ 'ANALYTICS.VIEW_DETAILS' | translate }}
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .last-test-card {
      border-radius: 16px;
      border: 1px solid #d6e4f0;
      background: #ffffff;
      box-shadow: 0 14px 26px rgba(15, 23, 42, 0.08);
      margin-bottom: 24px;

      mat-card-header {
        padding-bottom: 16px;
        border-bottom: 1px solid #d6e4f0;

        mat-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 20px;
          font-weight: 500;
          margin: 0;

          mat-icon {
            color: #0f766e;
            font-size: 24px;
            width: 24px;
            height: 24px;
          }
        }
      }

      mat-card-content {
        padding: 16px 20px;
      }
    }

    .loading-state,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      gap: 12px;

      p {
        margin: 0;
        color: #64748b;
        font-size: 14px;
      }

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #94a3b8;
      }

      .empty-hint {
        font-size: 12px;
        color: #94a3b8;
      }
    }

    .test-summary {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      background: #f8fafc;
      box-shadow: 0 10px 18px rgba(15, 23, 42, 0.06);
      height: 100%;
      box-sizing: border-box;
    }

    .test-list {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 24px;
      align-items: stretch;
    }

    .test-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .test-info {
      flex: 1;

      .test-name {
        font-size: 18px;
        font-weight: 600;
        color: #0f172a;
        margin: 0 0 2px 0;
      }

      .subject-name {
        font-size: 14px;
        color: #64748b;
        margin: 0 0 4px 0;
      }

      .completed-date {
        font-size: 11px;
        color: #94a3b8;
        margin: 0;
      }
    }

    .score-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 16px;
      border-radius: 12px;
      min-width: 80px;
      background: #f1f5f9;
      border: 2px solid #e2e8f0;

      &.excellent {
        background: #dcfce7;
        border-color: #86efac;
        color: #166534;
      }

      &.good {
        background: #dbeafe;
        border-color: #93c5fd;
        color: #1e40af;
      }

      &.needs-work {
        background: #fee2e2;
        border-color: #fca5a5;
        color: #991b1b;
      }

      .percentage {
        font-size: 24px;
        font-weight: 700;
        line-height: 1;
      }

      .score-text {
        font-size: 11px;
        opacity: 0.8;
        margin-top: 4px;
      }
    }

    .topics-section {
      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #0f172a;
        margin: 0 0 12px 0;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;

          &.success-icon {
            color: #22c55e;
          }

          &.warning-icon {
            color: #f59e0b;
          }
        }
      }

      .topics-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .strong-chip {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #86efac;
        }

        .weak-chip {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fbbf24;
        }
      }
    }

    .actions {
      display: flex;
      justify-content: center;
      padding-top: 8px;
      margin-top: auto;

      button {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }

    @media (max-width: 768px) {
      .test-header {
        flex-direction: column;
        align-items: stretch;
      }

      .score-badge {
        align-self: center;
      }

      .test-list {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LastTestCardComponent implements OnInit {
  private analyticsApi = inject(AnalyticsService);
  private notify = inject(NotifyService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  private _loading = signal(false);
  loading = computed(() => this._loading());

  private _summaries = signal<AttemptSummaryDto[]>([]);
  summaries = computed(() => this._summaries());

  ngOnInit(): void {
    this.loadSummaries();
  }

  loadSummaries(): void {
    this._loading.set(true);

    this.analyticsApi.getStudentAttemptsSummary().subscribe({
      next: (summaries) => {
        const sorted = [...summaries].sort(
          (a, b) => new Date(b.attemptDate).getTime() - new Date(a.attemptDate).getTime()
        );
        this._summaries.set(sorted);
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
        this.notify.error('Failed to load test results');
      }
    });
  }

  isExcellent(percent: number): boolean {
    return percent >= 80;
  }

  isGood(percent: number): boolean {
    return percent >= 60 && percent < 80;
  }

  needsWork(percent: number): boolean {
    return percent < 60;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getSubjectName(attempt: AttemptSummaryDto): string | null {
    const lang = this.translate.currentLang || this.translate.defaultLang || 'ru';
    if (lang.startsWith('kk')) {
      return attempt.subjectNameKk ?? attempt.subjectName ?? attempt.subjectNameRu ?? attempt.subjectNameEn ?? null;
    }
    if (lang.startsWith('en')) {
      return attempt.subjectNameEn ?? attempt.subjectName ?? attempt.subjectNameRu ?? attempt.subjectNameKk ?? null;
    }
    return attempt.subjectNameRu ?? attempt.subjectName ?? attempt.subjectNameKk ?? attempt.subjectNameEn ?? null;
  }

  openDetails(attemptId: string): void {
    if (attemptId) {
      this.router.navigate(['/app/analytics/attempt', attemptId]);
    }
  }
}
