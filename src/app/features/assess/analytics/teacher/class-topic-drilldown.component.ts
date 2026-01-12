import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { AnalyticsService, ClassTopicDrillDownDto } from '../analytics.service';
import { NotifyService } from '../../../../core/ui/notify.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Class Topic Drill-Down Component
 * Shows detailed class topic analysis
 */
@Component({
  standalone: true,
  selector: 'app-class-topic-drilldown',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatDividerModule
  ],
  template: `
    <div class="class-topic-drilldown">
      <!-- Header -->
      <div class="drilldown-header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <h2 class="topic-title">{{ topicData()?.topicName }}</h2>
          @if (topicData()) {
            <div class="topic-score" [class.excellent]="isExcellent()" [class.good]="isGood()" [class.needs-work]="needsWork()">
              {{ topicData()!.avgPercent }}% avg
            </div>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <mat-progress-spinner mode="indeterminate" diameter="40"></mat-progress-spinner>
          <p>Loading topic details...</p>
        </div>
      }

      @if (!loading() && topicData()) {
        <!-- Worst Questions Card -->
        <mat-card class="questions-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>quiz</mat-icon>
              Most Challenging Questions
            </mat-card-title>
          </mat-card-header>

          <mat-card-content>
            @if (topicData()!.topWorstQuestions.length === 0) {
              <div class="empty-state">
                <mat-icon>inbox</mat-icon>
                <p>No question data available</p>
              </div>
            } @else {
              @for (question of topicData()!.topWorstQuestions; track question.questionId; let idx = $index) {
                <div class="question-item">
                  <div class="question-header">
                    <div class="question-number">Q{{ idx + 1 }}</div>
                    <div class="question-content">
                      <p class="question-text">{{ question.questionText }}</p>
                      <div class="question-stats">
                        <mat-icon class="error-icon">error</mat-icon>
                        <span>{{ question.incorrectCount }} / {{ question.totalAttempts }} students struggled</span>
                        <span class="error-rate">{{ getErrorRate(question.incorrectCount, question.totalAttempts) }}% error rate</span>
                      </div>
                    </div>
                  </div>
                  @if (idx < topicData()!.topWorstQuestions.length - 1) {
                    <mat-divider></mat-divider>
                  }
                </div>
              }
            }
          </mat-card-content>
        </mat-card>

        <!-- Risk Students Card (if available) -->
        @if (topicData()!.riskStudents && topicData()!.riskStudents!.length > 0) {
          <mat-card class="students-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>group</mat-icon>
                Students Needing Support
              </mat-card-title>
            </mat-card-header>

            <mat-card-content>
              <div class="students-list">
                @for (student of topicData()!.riskStudents; track student.studentId) {
                  <div class="student-item">
                    <div class="student-info">
                      <mat-icon>person</mat-icon>
                      <span class="student-name">{{ student.studentName }}</span>
                    </div>
                    <div class="student-score" [class.critical]="student.percentage < 40">
                      {{ student.percentage }}%
                    </div>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .class-topic-drilldown {
      padding: 1.5rem;
      max-width: 1000px;
      margin: 0 auto;
    }

    .drilldown-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding: 20px;
      background: linear-gradient(135deg, #f3f8ff 0%, #f4fff6 100%);
      border-radius: 16px;
      border: 1px solid #d6e4f0;

      .header-content {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .topic-title {
        font-size: 24px;
        font-weight: 600;
        color: #0f172a;
        margin: 0;
      }

      .topic-score {
        font-size: 24px;
        font-weight: 700;
        padding: 8px 20px;
        border-radius: 12px;
        background: #f1f5f9;
        color: #64748b;

        &.excellent {
          background: #dcfce7;
          color: #166534;
        }

        &.good {
          background: #dbeafe;
          color: #1e40af;
        }

        &.needs-work {
          background: #fee2e2;
          color: #991b1b;
        }
      }
    }

    .loading-state,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
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
    }

    .questions-card,
    .students-card {
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
          font-size: 18px;
          font-weight: 500;
          margin: 0;

          mat-icon {
            color: #0f766e;
            font-size: 22px;
            width: 22px;
            height: 22px;
          }
        }
      }

      mat-card-content {
        padding: 16px 0;
      }
    }

    .question-item {
      padding: 16px 20px;
    }

    .question-header {
      display: flex;
      gap: 16px;

      .question-number {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        color: #64748b;
        font-size: 14px;
      }

      .question-content {
        flex: 1;

        .question-text {
          margin: 0 0 12px 0;
          color: #0f172a;
          font-size: 15px;
          line-height: 1.5;
        }

        .question-stats {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #dc2626;

          .error-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }

          .error-rate {
            margin-left: auto;
            padding: 4px 8px;
            background: #fee2e2;
            border-radius: 6px;
            font-weight: 600;
          }
        }
      }
    }

    .students-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 0 20px;
    }

    .student-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #f8fafc;
      border-radius: 10px;
      border: 1px solid #e5e7eb;

      .student-info {
        display: flex;
        align-items: center;
        gap: 12px;

        mat-icon {
          color: #64748b;
          font-size: 20px;
          width: 20px;
          height: 20px;
        }

        .student-name {
          font-size: 14px;
          font-weight: 500;
          color: #0f172a;
        }
      }

      .student-score {
        font-size: 16px;
        font-weight: 700;
        color: #f59e0b;

        &.critical {
          color: #dc2626;
        }
      }
    }

    mat-divider {
      margin: 0;
    }

    @media (max-width: 768px) {
      .class-topic-drilldown {
        padding: 1rem;
      }

      .drilldown-header {
        flex-direction: column;
        align-items: flex-start;

        .header-content {
          width: 100%;
          flex-direction: column;
          align-items: flex-start;
        }

        .topic-title {
          font-size: 20px;
        }
      }

      .question-header {
        flex-direction: column;
      }

      .student-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }
  `]
})
export class ClassTopicDrilldownComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private analyticsApi = inject(AnalyticsService);
  private notify = inject(NotifyService);
  private destroyRef = inject(DestroyRef);

  private _loading = signal(false);
  loading = computed(() => this._loading());

  private _topicData = signal<ClassTopicDrillDownDto | null>(null);
  topicData = computed(() => this._topicData());

  private _classId = signal('');
  private _testId = signal('');
  private _topicId = signal('');
  classId = computed(() => this._classId());
  testId = computed(() => this._testId());
  topicId = computed(() => this._topicId());

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const classId = params.get('classId') || '';
        const testId = params.get('testId') || '';
        const topicId = params.get('topicId') || '';
        this._classId.set(classId);
        this._testId.set(testId);
        this._topicId.set(topicId);
        if (!classId || !testId || !topicId) {
          this.router.navigate(['/app/analytics/classes']);
          return;
        }
        this.loadTopicDetails();
      });
  }

  loadTopicDetails(): void {
    this._loading.set(true);

    this.analyticsApi.getClassTopicDrillDown(this.classId(), this.testId(), this.topicId()).subscribe({
      next: (data) => {
        this._topicData.set(data);
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
        this.notify.error('Failed to load topic details');
      }
    });
  }

  isExcellent(): boolean {
    return (this.topicData()?.avgPercent ?? 0) >= 80;
  }

  isGood(): boolean {
    const pct = this.topicData()?.avgPercent ?? 0;
    return pct >= 60 && pct < 80;
  }

  needsWork(): boolean {
    return (this.topicData()?.avgPercent ?? 0) < 60;
  }

  getErrorRate(incorrect: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((incorrect / total) * 100);
  }

  goBack(): void {
    this.router.navigate(['/app/analytics/classes', this.classId()]);
  }
}
