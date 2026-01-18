import { Component, Input, OnChanges, SimpleChanges, DestroyRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AiCoachService, AiTopicHelpRequestDto, AiTopicHelpResult } from '../ai-coach.service';
import { NotifyService } from '../../../../core/ui/notify.service';

type AiHelpMode = 'coach' | 'short' | 'practice';

@Component({
  standalone: true,
  selector: 'app-ai-topic-help-card',
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
    <mat-card class="ai-topic-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>psychology_alt</mat-icon>
          {{ 'ANALYTICS.AI_TOPIC_HELP_TITLE' | translate }}
        </mat-card-title>
        @if (displayTopicName()) {
          <mat-card-subtitle>{{ displayTopicName() }}</mat-card-subtitle>
        }
      </mat-card-header>

      <mat-card-content>
        <div class="mode-actions">
          <button
            mat-stroked-button
            [class.active]="mode() === 'coach'"
            (click)="generateHelp('coach')"
            [disabled]="loading() || !attemptId || !topicId"
          >
            {{ 'ANALYTICS.AI_TOPIC_HELP_COACH' | translate }}
          </button>
          <button
            mat-stroked-button
            [class.active]="mode() === 'short'"
            (click)="generateHelp('short')"
            [disabled]="loading() || !attemptId || !topicId"
          >
            {{ 'ANALYTICS.AI_TOPIC_HELP_SHORT' | translate }}
          </button>
          <button
            mat-stroked-button
            [class.active]="mode() === 'practice'"
            (click)="generateHelp('practice')"
            [disabled]="loading() || !attemptId || !topicId"
          >
            {{ 'ANALYTICS.AI_TOPIC_HELP_PRACTICE' | translate }}
          </button>

          @if (loading()) {
            <mat-progress-spinner mode="indeterminate" diameter="28"></mat-progress-spinner>
          }
        </div>

        @if (errorMessage()) {
          <div class="error-state">
            <mat-icon>error_outline</mat-icon>
            <p>{{ errorMessage() }}</p>
          </div>
        }

        @if (result()) {
          <div class="result-state">
            <div class="result-meta">
              @if (isCached(result())) {
                <mat-chip class="cached-chip">{{ 'ANALYTICS.AI_CACHED_HINT' | translate }}</mat-chip>
              }
            </div>
            <div class="topic-sections">
              @if (result()!.mainError) {
                <section class="warning-box">
                  <h4>{{ 'ANALYTICS.AI_MAIN_ERROR_TITLE' | translate }}</h4>
                  <p>{{ result()!.mainError }}</p>
                </section>
              }

              @if (result()!.explanation) {
                <section class="topic-section">
                  <h3>{{ 'ANALYTICS.AI_EXPLANATION_TITLE' | translate }}</h3>
                  <p class="section-text">{{ result()!.explanation }}</p>
                </section>
              }

              @if (result()!.examples.length) {
                <section class="topic-section">
                  <h3>{{ 'ANALYTICS.AI_EXAMPLES_TITLE' | translate }}</h3>
                  <div class="example-grid">
                    @for (example of result()!.examples; track example.question) {
                      <div class="example-card">
                        <p class="label">{{ 'ANALYTICS.AI_EXAMPLE_QUESTION' | translate }}</p>
                        <p class="value">{{ example.question }}</p>
                        <p class="label">{{ 'ANALYTICS.AI_EXAMPLE_SOLUTION' | translate }}</p>
                        <p class="value">{{ example.solution }}</p>
                      </div>
                    }
                  </div>
                </section>
              }

              @if (result()!.practice.length) {
                <section class="topic-section">
                  <h3>{{ 'ANALYTICS.AI_PRACTICE_TITLE' | translate }}</h3>
                  <div class="practice-list">
                    @for (item of result()!.practice; track item.question; let idx = $index) {
                      <div class="practice-card">
                        <p class="label">{{ 'ANALYTICS.AI_PRACTICE_QUESTION' | translate }}</p>
                        <p class="value">{{ item.question }}</p>
                        <button mat-stroked-button class="answer-toggle" (click)="togglePracticeAnswer(idx)">
                          {{
                            isPracticeAnswerVisible(idx)
                              ? ('ANALYTICS.AI_HIDE_ANSWER' | translate)
                              : ('ANALYTICS.AI_SHOW_ANSWER' | translate)
                          }}
                        </button>
                        @if (isPracticeAnswerVisible(idx)) {
                          <div class="answer-box">
                            <p class="label">{{ 'ANALYTICS.AI_PRACTICE_ANSWER' | translate }}</p>
                            <p class="value">{{ item.answer }}</p>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </section>
              }
            </div>
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

    .ai-topic-card {
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

    .mode-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;

      button.active {
        border-color: #0f766e;
        color: #0f766e;
        background: rgba(13, 148, 136, 0.08);
      }
    }

    .result-meta {
      display: flex;
      justify-content: flex-end;
      margin-top: 8px;
    }

    .cached-chip {
      background: #e0f2fe;
      color: #0369a1;
      border: 1px solid #7dd3fc;
    }

    .topic-sections {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 12px;
    }

    .topic-section {
      h3 {
        margin: 0 0 10px;
        font-size: 16px;
        font-weight: 600;
        color: #0f172a;
      }
    }

    .section-text {
      margin: 0;
      color: #475569;
      line-height: 1.6;
    }

    .warning-box {
      background: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 12px;
      padding: 12px 14px;

      h4 {
        margin: 0 0 6px;
        font-size: 14px;
        font-weight: 600;
        color: #92400e;
      }

      p {
        margin: 0;
        color: #92400e;
        line-height: 1.6;
      }
    }

    .example-grid,
    .practice-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }

    .example-card,
    .practice-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 14px;
      background: #f8fafc;
    }

    .label {
      margin: 0 0 4px;
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .value {
      margin: 0 0 10px;
      color: #0f172a;
      line-height: 1.5;
    }

    .answer-toggle {
      margin-bottom: 10px;
    }

    .answer-box {
      padding: 10px 12px;
      border-radius: 10px;
      background: #ecfeff;
      border: 1px solid #a5f3fc;

      .value {
        margin: 0;
        color: #0f172a;
      }
    }

    .error-state {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 12px 14px;
      border-radius: 10px;
      background: #fee2e2;
      border: 1px solid #fca5a5;

      mat-icon {
        color: #b91c1c;
      }

      p {
        margin: 0;
        color: #b91c1c;
        font-size: 14px;
      }
    }

    .result-state {
      margin-top: 12px;
    }

    @media (max-width: 768px) {
      .mode-actions {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class AiTopicHelpCardComponent implements OnChanges {
  @Input({ required: true }) attemptId!: string;
  @Input({ required: true }) topicId!: string;
  @Input() topicName?: string;

  private aiCoach = inject(AiCoachService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private notify = inject(NotifyService);

  private _loading = signal(false);
  loading = computed(() => this._loading());

  private _errorMessage = signal<string | null>(null);
  errorMessage = computed(() => this._errorMessage());

  private _result = signal<AiTopicHelpResult | null>(null);
  result = computed(() => this._result());

  private _mode = signal<AiHelpMode>('coach');
  mode = computed(() => this._mode());
  private _practiceVisibility = signal<Record<number, boolean>>({});

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['attemptId'] || changes['topicId']) {
      this.resetState();
    }
  }

  generateHelp(mode: AiHelpMode): void {
    if (!this.attemptId || !this.topicId || this._loading()) {
      return;
    }

    const payload: AiTopicHelpRequestDto = {
      mode,
      language: this.getLanguage()
    };

    this._mode.set(mode);
    this._loading.set(true);
    this._errorMessage.set(null);
    this._practiceVisibility.set({});

    this.aiCoach.generateTopicHelp(this.attemptId, this.topicId, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this._result.set(result);
          this._loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this._loading.set(false);
          if (error.status === 429) {
            this.notify.warning(this.translate.instant('ANALYTICS.AI_LIMIT_REACHED'));
            return;
          }
          this._errorMessage.set(this.translate.instant('ANALYTICS.AI_SERVER_ERROR'));
        }
      });
  }

  private getLanguage(): string | undefined {
    const lang = this.translate.currentLang || this.translate.defaultLang;
    return lang ? lang.split('-')[0] : undefined;
  }

  private resetState(): void {
    this._loading.set(false);
    this._errorMessage.set(null);
    this._result.set(null);
    this._mode.set('coach');
    this._practiceVisibility.set({});
  }

  displayTopicName(): string | null {
    return this.result()?.topic?.topicName || this.topicName || null;
  }

  isCached(result: AiTopicHelpResult | null): boolean {
    return !!(result as { cached?: boolean } | null)?.cached;
  }

  togglePracticeAnswer(index: number): void {
    const current = this._practiceVisibility();
    this._practiceVisibility.set({
      ...current,
      [index]: !current[index]
    });
  }

  isPracticeAnswerVisible(index: number): boolean {
    return !!this._practiceVisibility()[index];
  }
}
