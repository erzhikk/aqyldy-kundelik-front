import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AnalyticsService, ClassAnalyticsDto } from '../analytics.service';
import { NotifyService } from '../../../../core/ui/notify.service';

/**
 * Teacher Classes List Component
 * Shows list of classes with analytics overview
 */
@Component({
  standalone: true,
  selector: 'app-teacher-classes-list',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="teacher-classes-page">
      <div class="page-header">
        <h1 class="page-title">Class Analytics</h1>
        <p class="page-subtitle">Monitor performance across your classes</p>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <mat-progress-spinner mode="indeterminate" diameter="50"></mat-progress-spinner>
          <p>Loading classes...</p>
        </div>
      }

      @if (!loading() && classes().length === 0) {
        <div class="empty-state">
          <mat-icon>school</mat-icon>
          <p>No classes found</p>
          <span class="empty-hint">You don't have any classes assigned yet</span>
        </div>
      }

      @if (!loading() && classes().length > 0) {
        <div class="classes-grid">
          @for (classItem of classes(); track classItem.classId) {
            <mat-card class="class-card" (click)="openClass(classItem.classId)">
              <mat-card-header>
                <div class="class-icon">
                  <mat-icon>groups</mat-icon>
                </div>
                <mat-card-title>{{ classItem.className }}</mat-card-title>
              </mat-card-header>

              <mat-card-content>
                @if (classItem.lastTestName) {
                  <div class="class-stats">
                    <div class="stat-item">
                      <span class="stat-label">Last Test</span>
                      <span class="stat-value">{{ classItem.lastTestName }}</span>
                    </div>
                    @if (classItem.avgPercentage !== undefined) {
                      <div class="stat-item">
                        <span class="stat-label">Avg Score</span>
                        <div class="score-badge" [class.excellent]="isExcellent(classItem.avgPercentage!)" [class.good]="isGood(classItem.avgPercentage!)" [class.needs-work]="needsWork(classItem.avgPercentage!)">
                          {{ classItem.avgPercentage }}%
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="no-data">
                    <mat-icon>inbox</mat-icon>
                    <span>No test data available</span>
                  </div>
                }
              </mat-card-content>

              <mat-card-actions>
                <button mat-button color="primary">
                  <mat-icon>analytics</mat-icon>
                  View Analytics
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .teacher-classes-page {
      padding: 1.5rem;
      max-width: 1400px;
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

    .loading-state,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      gap: 12px;

      p {
        margin: 0;
        color: #64748b;
        font-size: 16px;
        font-weight: 500;
      }

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #94a3b8;
      }

      .empty-hint {
        font-size: 13px;
        color: #94a3b8;
      }
    }

    .classes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }

    .class-card {
      border-radius: 16px;
      border: 1px solid #d6e4f0;
      background: #ffffff;
      box-shadow: 0 8px 16px rgba(15, 23, 42, 0.06);
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 14px 26px rgba(15, 23, 42, 0.12);
        border-color: #0f766e;
      }

      mat-card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-bottom: 16px;
        border-bottom: 1px solid #e5e7eb;

        .class-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #0ea5e9 0%, #0f766e 100%);
          display: flex;
          align-items: center;
          justify-content: center;

          mat-icon {
            color: white;
            font-size: 28px;
            width: 28px;
            height: 28px;
          }
        }

        mat-card-title {
          font-size: 18px;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
        }
      }

      mat-card-content {
        padding: 16px 0;
      }

      mat-card-actions {
        border-top: 1px solid #e5e7eb;
        padding: 12px 16px;
        display: flex;
        justify-content: flex-end;
      }
    }

    .class-stats {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;

      .stat-label {
        font-size: 13px;
        color: #64748b;
        font-weight: 500;
      }

      .stat-value {
        font-size: 14px;
        color: #0f172a;
        font-weight: 600;
      }
    }

    .score-badge {
      padding: 4px 12px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
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

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 20px;
      color: #94a3b8;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      span {
        font-size: 12px;
      }
    }

    @media (max-width: 768px) {
      .teacher-classes-page {
        padding: 1rem;
      }

      .classes-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .page-title {
        font-size: 22px;
      }
    }
  `]
})
export class TeacherClassesListComponent implements OnInit {
  private analyticsApi = inject(AnalyticsService);
  private notify = inject(NotifyService);
  private router = inject(Router);

  private _loading = signal(false);
  loading = computed(() => this._loading());

  private _classes = signal<ClassAnalyticsDto[]>([]);
  classes = computed(() => this._classes());

  ngOnInit(): void {
    this.loadClasses();
  }

  loadClasses(): void {
    this._loading.set(true);

    this.analyticsApi.getTeacherClasses().subscribe({
      next: (classes) => {
        this._classes.set(classes);
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
        this.notify.error('Failed to load classes');
      }
    });
  }

  isExcellent(percentage: number): boolean {
    return percentage >= 80;
  }

  isGood(percentage: number): boolean {
    return percentage >= 60 && percentage < 80;
  }

  needsWork(percentage: number): boolean {
    return percentage < 60;
  }

  openClass(classId: string): void {
    this.router.navigate(['/app/analytics/classes', classId]);
  }
}
