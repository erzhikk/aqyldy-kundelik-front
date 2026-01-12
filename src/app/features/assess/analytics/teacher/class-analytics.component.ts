import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { NgxEchartsModule } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { AnalyticsService, ClassTestSummaryDto, ClassTopicDto } from '../analytics.service';
import { NotifyService } from '../../../../core/ui/notify.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface ChartData {
  name: string;
  value: number;
  extra: {
    topicId: string;
  };
}

/**
 * Class Analytics Component
 * Shows class test summary and topics performance chart
 */
@Component({
  standalone: true,
  selector: 'app-class-analytics',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    NgxEchartsModule
  ],
  template: `
    <div class="class-analytics-page">
      <!-- Header -->
      <div class="page-header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <h1 class="page-title">{{ summary()?.className || 'Class Analytics' }}</h1>
          <p class="page-subtitle">Performance overview and detailed analytics</p>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <mat-progress-spinner mode="indeterminate" diameter="50"></mat-progress-spinner>
          <p>Loading analytics...</p>
        </div>
      }

      @if (!loading() && summary()) {
        <!-- Summary Card -->
        <mat-card class="summary-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>assessment</mat-icon>
              Last Test Summary
            </mat-card-title>
          </mat-card-header>

          <mat-card-content>
            <div class="summary-content">
              <!-- Test Info -->
              <div class="test-info">
                <h3 class="test-name">{{ summary()!.testName }}</h3>
              </div>

              <!-- Stats Grid -->
              <div class="stats-grid">
                <div class="stat-box">
                  <div class="stat-label">Average</div>
                  <div class="stat-value" [class.excellent]="isExcellent(summary()!.avgPercent)" [class.good]="isGood(summary()!.avgPercent)" [class.needs-work]="needsWork(summary()!.avgPercent)">
                    {{ summary()!.avgPercent }}%
                  </div>
                </div>

                <div class="stat-box">
                  <div class="stat-label">Median</div>
                  <div class="stat-value">
                    {{ summary()!.medianPercent }}%
                  </div>
                </div>

                <div class="stat-box">
                  <div class="stat-label">At-Risk Students</div>
                  <div class="stat-value risk">
                    {{ summary()!.riskStudentsCount }}
                  </div>
                </div>
              </div>

              <!-- Problematic Topics -->
              @if (summary()!.problematicTopics.length > 0) {
                <div class="topics-section">
                  <h4>
                    <mat-icon>warning</mat-icon>
                    Problematic Topics
                  </h4>
                  <mat-chip-set>
                    @for (topic of summary()!.problematicTopics; track topic) {
                      <mat-chip class="problem-chip">{{ topic }}</mat-chip>
                    }
                  </mat-chip-set>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Topics Chart -->
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>bar_chart</mat-icon>
              Performance by Topic
            </mat-card-title>
          </mat-card-header>

          <mat-card-content>
            @if (loadingTopics()) {
              <div class="loading-state">
                <mat-progress-spinner mode="indeterminate" diameter="40"></mat-progress-spinner>
                <p>Loading topics...</p>
              </div>
            }

            @if (!loadingTopics() && chartData().length > 0) {
              <div class="chart-container">
                <div
                  echarts
                  class="echarts-chart"
                  [options]="chartOptions()"
                  (chartClick)="onChartClick($event)"
                ></div>
              </div>

              <div class="legend-hint">
                <mat-icon>info</mat-icon>
                <span>Click on any bar to see detailed analysis for that topic</span>
              </div>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .class-analytics-page {
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

    .loading-state {
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
    }

    .summary-card,
    .chart-card {
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
    }

    .summary-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .test-info {
      .test-name {
        font-size: 18px;
        font-weight: 600;
        color: #0f172a;
        margin: 0;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
    }

    .stat-box {
      padding: 16px;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      text-align: center;

      .stat-label {
        font-size: 13px;
        color: #64748b;
        margin-bottom: 8px;
        font-weight: 500;
      }

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: #0f172a;

        &.excellent {
          color: #166534;
        }

        &.good {
          color: #1e40af;
        }

        &.needs-work {
          color: #991b1b;
        }

        &.risk {
          color: #dc2626;
        }
      }
    }

    .topics-section {
      h4 {
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
          color: #f59e0b;
        }
      }

      mat-chip-set {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .problem-chip {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fbbf24;
        }
      }
    }

    .chart-container {
      width: 100%;
      height: 400px;
      padding: 20px;

      .echarts-chart {
        width: 100%;
        height: 100%;
      }
    }

    .legend-hint {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      background: #f8fafc;
      border-radius: 8px;
      margin: 0 16px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #64748b;
      }

      span {
        font-size: 12px;
        color: #64748b;
      }
    }

    @media (max-width: 768px) {
      .class-analytics-page {
        padding: 1rem;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .page-title {
        font-size: 22px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .chart-container {
        height: 300px;
        padding: 10px;
      }
    }
  `]
})
export class ClassAnalyticsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private analyticsApi = inject(AnalyticsService);
  private notify = inject(NotifyService);
  private destroyRef = inject(DestroyRef);

  private _loading = signal(false);
  loading = computed(() => this._loading());

  private _loadingTopics = signal(false);
  loadingTopics = computed(() => this._loadingTopics());

  private _summary = signal<ClassTestSummaryDto | null>(null);
  summary = computed(() => this._summary());

  private _topics = signal<ClassTopicDto[]>([]);
  topics = computed(() => this._topics());

  private _classId = signal('');
  classId = computed(() => this._classId());

  chartData = computed<ChartData[]>(() => {
    const sorted = [...this._topics()].sort((a, b) => a.avgPercent - b.avgPercent);
    return sorted.map(topic => ({
      name: topic.topicName,
      value: topic.avgPercent,
      extra: {
        topicId: topic.topicId
      }
    }));
  });

  chartOptions = computed<EChartsOption>(() => {
    const data = this.chartData();
    return {
      grid: {
        left: 40,
        right: 16,
        top: 20,
        bottom: 40,
        containLabel: true
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const item = Array.isArray(params) ? params[0] : params;
          return `${item?.name}: ${item?.value}%`;
        }
      },
      xAxis: {
        type: 'category',
        data: data.map(item => item.name),
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          interval: 0
        },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e5e7eb' } }
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: {
          formatter: '{value}%',
          color: '#64748b',
          fontSize: 11
        },
        splitLine: { lineStyle: { color: '#e5e7eb' } }
      },
      series: [
        {
          type: 'bar',
          data: data.map(item => ({
            value: item.value,
            itemStyle: { color: this.getColorByPercentage(item.value) }
          })),
          barWidth: '60%',
          label: {
            show: true,
            position: 'top',
            formatter: '{c}%'
          }
        }
      ]
    };
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const classId = params.get('classId') || '';
        this._classId.set(classId);
        if (!classId) {
          this.router.navigate(['/app/analytics/classes']);
          return;
        }
        this.loadSummary();
      });
  }

  loadSummary(): void {
    this._loading.set(true);

    this.analyticsApi.getClassLastTestSummary(this.classId()).subscribe({
      next: (summary) => {
        this._summary.set(summary);
        this._loading.set(false);
        this.loadTopics(summary.testId);
      },
      error: () => {
        this._loading.set(false);
        this.notify.error('Failed to load class summary');
      }
    });
  }

  loadTopics(testId: string): void {
    this._loadingTopics.set(true);

    this.analyticsApi.getClassTestTopics(this.classId(), testId).subscribe({
      next: (topics) => {
        this._topics.set(topics);
        this._loadingTopics.set(false);
      },
      error: () => {
        this._loadingTopics.set(false);
        this.notify.error('Failed to load topics');
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

  getColorByPercentage(percentage: number): string {
    if (percentage >= 80) return '#22c55e';
    if (percentage >= 60) return '#3b82f6';
    if (percentage >= 40) return '#f59e0b';
    return '#ef4444';
  }

  onChartClick(event: any): void {
    const selected = this.chartData()[event?.dataIndex];
    if (!selected) return;
    const testId = this.summary()?.testId;
    if (testId) {
      this.router.navigate([
        '/app/analytics/classes',
        this.classId(),
        'test',
        testId,
        'topic',
        selected.extra.topicId
      ]);
    }
  }

  goBack(): void {
    this.router.navigate(['/app/analytics/classes']);
  }
}
