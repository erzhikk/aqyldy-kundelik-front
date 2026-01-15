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
import { AiCoachService, AiGeneratedDto, AiPlanRequestDto } from '../ai-coach.service';

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
              @if (result()!.cached) {
                <mat-chip class="cached-chip">{{ 'ANALYTICS.AI_CACHED_HINT' | translate }}</mat-chip>
              }
            </div>
            <pre class="ai-text">{{ result()!.content }}</pre>
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

    .ai-plan-card {
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

    .actions {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;

      button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
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

    .ai-text {
      margin: 12px 0 0;
      white-space: pre-wrap;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.6;
      color: #1f2937;
      background: #f8fafc;
      border-radius: 12px;
      padding: 16px;
      border: 1px solid #e2e8f0;
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
      .actions {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class AiPlanCardComponent implements OnChanges {
  @Input({ required: true }) attemptId!: string;

  private aiCoach = inject(AiCoachService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  private _loading = signal(false);
  loading = computed(() => this._loading());

  private _errorMessage = signal<string | null>(null);
  errorMessage = computed(() => this._errorMessage());

  private _result = signal<AiGeneratedDto | null>(null);
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
          this._errorMessage.set(this.getErrorMessage(error));
        }
      });
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 429) {
      return this.translate.instant('ANALYTICS.AI_LIMIT_REACHED');
    }
    return 'Не удалось получить ответ';
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
}
