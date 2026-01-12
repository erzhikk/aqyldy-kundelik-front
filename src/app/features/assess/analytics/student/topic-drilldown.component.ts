import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { AnalyticsService, TopicDrillDownDto, QuestionResultDto } from '../analytics.service';
import { NotifyService } from '../../../../core/ui/notify.service';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Topic Drill-Down Component
 * Level 3: Shows detailed question breakdown for a topic
 */
@Component({
  standalone: true,
  selector: 'app-topic-drilldown',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatDividerModule,
    TranslateModule
  ],
  template: `
    <div class="topic-drilldown">
      <!-- Header -->
      <div class="drilldown-header">
        @if (!isDialog()) {
          <button mat-icon-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
        }
        <div class="header-content">
          <h2 class="topic-title">{{ topicData()?.topicName }}</h2>
          @if (topicData() && !isDialog()) {
            <div class="topic-score" [class.excellent]="isExcellent()" [class.good]="isGood()" [class.needs-work]="needsWork()">
              {{ topicData()!.percentage }}%
            </div>
          }
        </div>
        @if (isDialog()) {
          <button mat-icon-button (click)="closeDialog()" aria-label="Close">
            <mat-icon>close</mat-icon>
          </button>
        }
      </div>

      @if (loading()) {
        <div class="loading-state">
          <mat-progress-spinner mode="indeterminate" diameter="40"></mat-progress-spinner>
          <p>{{ 'ANALYTICS.DRILLDOWN_LOADING' | translate }}</p>
        </div>
      }

      @if (!loading() && topicData()) {
        <mat-card class="questions-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>quiz</mat-icon>
              {{ 'ANALYTICS.DRILLDOWN_TITLE' | translate }}
            </mat-card-title>
          </mat-card-header>

          <mat-card-content>
            @if (questions().length === 0) {
              <div class="empty-state">
                <mat-icon>inbox</mat-icon>
                <p>{{ 'ANALYTICS.DRILLDOWN_EMPTY' | translate }}</p>
              </div>
            }

            @for (question of questions(); track question.questionId; let idx = $index) {
              <mat-expansion-panel class="question-panel" [class.correct]="question.isCorrect" [class.incorrect]="!question.isCorrect">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <div class="question-header">
                      <div class="question-status">
                        <mat-icon [class.correct-icon]="question.isCorrect" [class.incorrect-icon]="!question.isCorrect">
                          {{ question.isCorrect ? 'check_circle' : 'cancel' }}
                        </mat-icon>
                        <span class="question-number">
                          {{ 'ANALYTICS.DRILLDOWN_QUESTION_NUMBER' | translate:{ index: idx + 1 } }}
                        </span>
                      </div>
                      <span class="question-preview">{{ truncate(question.questionText, 60) }}</span>
                    </div>
                  </mat-panel-title>
                </mat-expansion-panel-header>

                <div class="question-details">
                  <!-- Question Text -->
                  <div class="detail-section">
                    <h4>{{ 'ANALYTICS.DRILLDOWN_QUESTION_LABEL' | translate }}</h4>
                    <p class="question-text">{{ question.questionText }}</p>
                  </div>

                  <mat-divider></mat-divider>

                  <!-- Answers -->
                  <div class="detail-section">
                    @if (question.selectedAnswerText) {
                      <div class="answer-block" [class.correct-answer]="question.isCorrect" [class.wrong-answer]="!question.isCorrect">
                        <h4>{{ 'ANALYTICS.DRILLDOWN_YOUR_ANSWER' | translate }}</h4>
                        <p>{{ question.selectedAnswerText }}</p>
                      </div>
                    }

                    @if (!question.isCorrect && question.correctAnswerText) {
                      <div class="answer-block correct-answer">
                        <h4>{{ 'ANALYTICS.DRILLDOWN_CORRECT_ANSWER' | translate }}</h4>
                        <p>{{ question.correctAnswerText }}</p>
                      </div>
                    }
                  </div>

                  <!-- Explanation -->
                  @if (question.explanation) {
                    <mat-divider></mat-divider>
                    <div class="detail-section explanation-section">
                      <h4>
                        <mat-icon>lightbulb</mat-icon>
                        {{ 'ANALYTICS.DRILLDOWN_EXPLANATION' | translate }}
                      </h4>
                      <p class="explanation-text">{{ question.explanation }}</p>
                    </div>
                  }
                </div>
              </mat-expansion-panel>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .topic-drilldown {
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
        font-size: 28px;
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

    .questions-card {
      border-radius: 16px;
      border: 1px solid #d6e4f0;
      background: #ffffff;
      box-shadow: 0 14px 26px rgba(15, 23, 42, 0.08);

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

    .question-panel {
      margin-bottom: 12px;
      border-radius: 12px !important;
      border: 2px solid #e5e7eb;

      &.correct {
        border-color: #86efac;
        background: #f0fdf4;
      }

      &.incorrect {
        border-color: #fca5a5;
        background: #fef2f2;
      }

      ::ng-deep .mat-expansion-panel-header {
        padding: 16px 20px;
      }
    }

    .question-header {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;

      .question-status {
        display: flex;
        align-items: center;
        gap: 8px;
        white-space: nowrap;

        mat-icon {
          font-size: 22px;
          width: 22px;
          height: 22px;

          &.correct-icon {
            color: #22c55e;
          }

          &.incorrect-icon {
            color: #ef4444;
          }
        }

        .question-number {
          font-weight: 600;
          color: #0f172a;
        }
      }

      .question-preview {
        color: #64748b;
        font-size: 14px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .question-details {
      padding: 16px 20px;
    }

    .detail-section {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      h4 {
        font-size: 14px;
        font-weight: 600;
        color: #0f172a;
        margin: 0 0 8px 0;
        display: flex;
        align-items: center;
        gap: 6px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: #f59e0b;
        }
      }

      p {
        margin: 0;
        color: #475569;
        line-height: 1.6;
      }
    }

    .answer-block {
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      &.correct-answer {
        background: #dcfce7;
        border: 1px solid #86efac;

        h4 {
          color: #166534;
        }

        p {
          color: #166534;
        }
      }

      &.wrong-answer {
        background: #fee2e2;
        border: 1px solid #fca5a5;

        h4 {
          color: #991b1b;
        }

        p {
          color: #991b1b;
        }
      }
    }

    .explanation-section {
      background: #fef3c7;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #fbbf24;

      h4 {
        color: #92400e;
      }

      .explanation-text {
        color: #92400e;
        font-style: italic;
      }
    }

    mat-divider {
      margin: 16px 0;
    }

    @media (max-width: 768px) {
      .topic-drilldown {
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

        .topic-score {
          align-self: flex-start;
        }
      }

      .question-header {
        flex-direction: column;
        align-items: flex-start;

        .question-preview {
          white-space: normal;
        }
      }
    }
  `]
})
export class TopicDrilldownComponent implements OnInit {
  private analyticsApi = inject(AnalyticsService);
  private notify = inject(NotifyService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private dialogRef = inject<MatDialogRef<TopicDrilldownComponent> | null>(MatDialogRef, { optional: true });
  private dialogData = inject<{ attemptId?: string; topicId?: string } | null>(MAT_DIALOG_DATA, { optional: true });

  private _loading = signal(false);
  loading = computed(() => this._loading());

  private _topicData = signal<TopicDrillDownDto | null>(null);
  topicData = computed(() => this._topicData());
  questions = computed(() => this.topicData()?.questions ?? []);
  private _attemptId = signal('');
  private _topicId = signal('');

  ngOnInit(): void {
    if (this.dialogData?.attemptId && this.dialogData?.topicId) {
      this._attemptId.set(this.dialogData.attemptId);
      this._topicId.set(this.dialogData.topicId);
      this.loadTopicDetails();
      return;
    }

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const attemptId = params.get('attemptId') || '';
        const topicId = params.get('topicId') || '';
        this._attemptId.set(attemptId);
        this._topicId.set(topicId);
        if (!attemptId || !topicId) {
          if (this.dialogRef) {
            this.dialogRef.close();
          } else {
            this.router.navigate(['/app/analytics']);
          }
          return;
        }
        this.loadTopicDetails();
      });
  }

  attemptId = (): string => {
    return this._attemptId();
  };

  topicId = (): string => {
    return this._topicId();
  };

  loadTopicDetails(): void {
    this._loading.set(true);

    this.analyticsApi.getTopicDrillDown(this.attemptId(), this.topicId()).subscribe({
      next: (data) => {
        this._topicData.set(this.normalizeTopicData(data));
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
        this.notify.error('Failed to load topic details');
      }
    });
  }

  private normalizeTopicData(data: any): TopicDrillDownDto {
    const rawQuestions = Array.isArray(data?.questions)
      ? data.questions
      : Array.isArray(data)
        ? data
        : [];

    return {
      topicId: data?.topicId ?? this.topicId(),
      topicName: data?.topicName ?? '',
      percentage: data?.percentage ?? 0,
      questions: rawQuestions.map((question: any) => this.normalizeQuestion(question))
    };
  }

  private normalizeQuestion(question: any): QuestionResultDto {
    return {
      questionId: question?.questionId ?? '',
      questionText: question?.questionText ?? question?.text ?? '',
      isCorrect: !!question?.isCorrect,
      selectedAnswerId: question?.selectedAnswerId ?? question?.choiceId,
      selectedAnswerText: question?.selectedAnswerText ?? question?.choiceText,
      correctAnswerId: question?.correctAnswerId,
      correctAnswerText: question?.correctAnswerText,
      explanation: question?.explanation
    };
  }

  isExcellent(): boolean {
    return (this.topicData()?.percentage ?? 0) >= 80;
  }

  isGood(): boolean {
    const pct = this.topicData()?.percentage ?? 0;
    return pct >= 60 && pct < 80;
  }

  needsWork(): boolean {
    return (this.topicData()?.percentage ?? 0) < 60;
  }

  truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  }

  goBack(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
      return;
    }
    this.router.navigate(['/app/analytics/attempt', this.attemptId()]);
  }

  closeDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  isDialog(): boolean {
    return !!this.dialogRef;
  }
}
