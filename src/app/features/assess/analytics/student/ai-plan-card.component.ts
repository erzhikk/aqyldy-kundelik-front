import { Component, Input, OnChanges, SimpleChanges, DestroyRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AiCoachService, AiPlanRequestDto, AiPlanResult } from '../ai-coach.service';
import { NotifyService } from '../../../../core/ui/notify.service';

@Component({
  standalone: true,
  selector: 'app-ai-plan-card',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatExpansionModule,
    TranslateModule
  ],
  template: `
    <mat-card class="ai-plan-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>auto_awesome</mat-icon>
          {{ 'ANALYTICS.AI_TITLE' | translate }}
        </mat-card-title>
      </mat-card-header>

      <mat-card-content>
        <div class="actions">
          <button
            mat-raised-button
            color="primary"
            (click)="generatePlan()"
            [disabled]="loading() || !attemptId"
          >
            <mat-icon>psychology</mat-icon>
            {{ 'ANALYTICS.AI_PLAN_BUTTON' | translate }}
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
            <div class="plan-sections">
              @if (result()!.weakTopics.length) {
                <section class="plan-section">
                  <h3>{{ 'ANALYTICS.AI_WEAK_TOPICS_TITLE' | translate }}</h3>
                  <div class="table-wrap">
                    <table class="weak-topics-table">
                      <thead>
                        <tr>
                          <th>{{ 'ANALYTICS.AI_TOPIC_COLUMN' | translate }}</th>
                          <th>{{ 'ANALYTICS.AI_ACCURACY_COLUMN' | translate }}</th>
                          <th>{{ 'ANALYTICS.AI_MISTAKE_COLUMN' | translate }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (topic of result()!.weakTopics; track topic.topicId) {
                          <tr>
                            <td class="topic-name">{{ topic.topicName }}</td>
                            <td>
                              <span class="accuracy-pill" [ngClass]="getAccuracyClass(topic.accuracy)">
                                {{ formatAccuracy(topic.accuracy) }}%
                              </span>
                            </td>
                            <td class="topic-mistake">{{ topic.mainMistake }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </section>
              }

              @if (result()!.weeklyPlan.length) {
                <section class="plan-section">
                  <h3>{{ 'ANALYTICS.AI_WEEKLY_PLAN_TITLE' | translate }}</h3>
                  <mat-accordion class="weekly-plan" multi>
                    @for (dayPlan of result()!.weeklyPlan; track dayPlan.day) {
                      <mat-expansion-panel>
                        <mat-expansion-panel-header>
                          <mat-panel-title>
                            {{ 'ANALYTICS.AI_DAY_LABEL' | translate:{ day: dayPlan.day } }}
                          </mat-panel-title>
                          <mat-panel-description>
                            <span class="plan-focus">{{ dayPlan.focus }}</span>
                            <span class="plan-time">
                              {{ dayPlan.timeMinutes }} {{ 'ANALYTICS.AI_MINUTES_SHORT' | translate }}
                            </span>
                          </mat-panel-description>
                        </mat-expansion-panel-header>
                        <div class="plan-body">
                          <p class="plan-focus-text">{{ dayPlan.focus }}</p>
                          <ul>
                            @for (action of dayPlan.actions; track action) {
                              <li>{{ action }}</li>
                            }
                          </ul>
                        </div>
                      </mat-expansion-panel>
                    }
                  </mat-accordion>
                </section>
              }

              @if (result()!.rules.length) {
                <section class="plan-section">
                  <h3>{{ 'ANALYTICS.AI_RULES_TITLE' | translate }}</h3>
                  <ul class="rules-list">
                    @for (rule of result()!.rules; track rule) {
                      <li>{{ rule }}</li>
                    }
                  </ul>
                </section>
              }

              @if (result()!.selfCheck.length) {
                <section class="plan-section">
                  <h3>{{ 'ANALYTICS.AI_SELF_CHECK_TITLE' | translate }}</h3>
                  <div class="self-check-grid">
                    @for (item of result()!.selfCheck; track item.question) {
                      <div class="self-check-card">
                        <p class="question">{{ item.question }}</p>
                        <p class="answer">{{ item.answer }}</p>
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
  styleUrls: ['./ai-plan-card.component.scss']
})
export class AiPlanCardComponent implements OnChanges {
  @Input({ required: true }) attemptId!: string;

  private aiCoach = inject(AiCoachService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private notify = inject(NotifyService);

  private _loading = signal(false);
  loading = computed(() => this._loading());

  private _errorMessage = signal<string | null>(null);
  errorMessage = computed(() => this._errorMessage());

  private _result = signal<AiPlanResult | null>(null);
  result = computed(() => this._result());

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['attemptId']) {
      this.resetState();
    }
  }

  generatePlan(): void {
    if (!this.attemptId || this._loading()) {
      return;
    }

    const payload: AiPlanRequestDto = {
      attemptId: this.attemptId,
      language: this.getLanguage()
    };

    this._loading.set(true);
    this._errorMessage.set(null);

    this.aiCoach.generatePlan(payload)
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
  }

  isCached(result: AiPlanResult | null): boolean {
    return !!(result as { cached?: boolean } | null)?.cached;
  }

  getAccuracyClass(accuracy: number): string {
    const normalized = this.normalizeAccuracy(accuracy);
    if (normalized < 50) {
      return 'accuracy-low';
    }
    if (normalized < 70) {
      return 'accuracy-mid';
    }
    return 'accuracy-high';
  }

  formatAccuracy(accuracy: number): number {
    return this.normalizeAccuracy(accuracy);
  }

  private normalizeAccuracy(accuracy: number): number {
    if (accuracy <= 1) {
      return Math.round(accuracy * 100);
    }
    return Math.round(accuracy);
  }
}
