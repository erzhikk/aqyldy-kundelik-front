import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TopicsChartComponent } from './topics-chart.component';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Attempt Details Page
 * Shows detailed analytics for a specific test attempt
 */
@Component({
  standalone: true,
  selector: 'app-attempt-details',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    TopicsChartComponent,
    TranslateModule
  ],
  template: `
    <div class="attempt-details-page">
      <div class="page-header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <h1 class="page-title">{{ 'ANALYTICS.ATTEMPT_TITLE' | translate }}</h1>
          <p class="page-subtitle">{{ 'ANALYTICS.ATTEMPT_SUBTITLE' | translate }}</p>
        </div>
      </div>

      <div class="details-content">
        <app-topics-chart [attemptId]="attemptId()"></app-topics-chart>
      </div>
    </div>
  `,
  styles: [`
    .attempt-details-page {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 2rem;
      padding: 20px 24px;
      background: linear-gradient(135deg, #f3f8ff 0%, #f4fff6 100%);
      border-radius: 16px;
      border: 1px solid #d6e4f0;

      .header-content {
        flex: 1;
      }
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

    .details-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    @media (max-width: 768px) {
      .attempt-details-page {
        padding: 1rem;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .page-title {
        font-size: 22px;
      }
    }
  `]
})
export class AttemptDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  private _attemptId = signal('');
  attemptId = computed(() => this._attemptId());

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const attemptId = params.get('attemptId') || '';
        this._attemptId.set(attemptId);
        if (!attemptId) {
          this.router.navigate(['/app/analytics']);
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/app/analytics']);
  }
}
