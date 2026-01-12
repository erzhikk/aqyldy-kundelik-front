import { Component, Input, OnInit, OnChanges, SimpleChanges, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxEchartsModule } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { TranslateModule } from '@ngx-translate/core';
import { TopicDrilldownComponent } from './topic-drilldown.component';
import { AnalyticsService, AttemptTopicDto } from '../analytics.service';
import { NotifyService } from '../../../../core/ui/notify.service';

interface ChartData {
  name: string;
  value: number;
  extra: {
    topicId: string;
    correctCount: number;
    totalCount: number;
  };
}

/**
 * Topics Chart Component
 * Level 2: Bar chart showing topic performance
 */
@Component({
  standalone: true,
  selector: 'app-topics-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDialogModule,
    NgxEchartsModule,
    TranslateModule,
    TopicDrilldownComponent
  ],
  template: `
    <mat-card class="topics-chart-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>bar_chart</mat-icon>
          {{ 'ANALYTICS.TOPICS_TITLE' | translate }}
        </mat-card-title>
      </mat-card-header>

      <mat-card-content>
        @if (loading()) {
          <div class="loading-state">
            <mat-progress-spinner mode="indeterminate" diameter="40"></mat-progress-spinner>
            <p>{{ 'ANALYTICS.TOPICS_LOADING' | translate }}</p>
          </div>
        }

        @if (!loading() && chartData().length === 0) {
          <div class="empty-state">
            <mat-icon>inbox</mat-icon>
            <p>{{ 'ANALYTICS.TOPICS_EMPTY' | translate }}</p>
          </div>
        }

        @if (!loading() && chartData().length > 0) {
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
            <span>{{ 'ANALYTICS.TOPICS_HINT' | translate }}</span>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .topics-chart-card {
      border-radius: 16px;
      border: 1px solid #d6e4f0;
      background: #ffffff;
      box-shadow: 0 14px 26px rgba(15, 23, 42, 0.08);
      margin-bottom: 24px;
      max-width: 100%;
      overflow: hidden;

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
        max-width: 100%;
        overflow: hidden;
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

    .chart-container {
      width: 100%;
      height: 350px;
      padding: 10px;
      overflow: hidden;
      box-sizing: border-box;

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
      .chart-container {
        height: 300px;
        padding: 10px;
      }
    }
  `]
})
export class TopicsChartComponent implements OnInit, OnChanges {
  @Input({ required: true }) attemptId!: string;

  private analyticsApi = inject(AnalyticsService);
  private notify = inject(NotifyService);
  private dialog = inject(MatDialog);

  private _loading = signal(false);
  loading = computed(() => this._loading());

  private _topics = signal<AttemptTopicDto[]>([]);
  topics = computed(() => this._topics());

  // Transform topics to chart data format
  chartData = computed<ChartData[]>(() => {
    const sorted = [...this._topics()].sort((a, b) => a.percent - b.percent);
    return sorted.map(topic => ({
      name: topic.topicName,
      value: topic.percent,
      extra: {
        topicId: topic.topicId,
        correctCount: topic.correct,
        totalCount: topic.total
      }
    }));
  });

  // Custom colors based on percentage
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
    this.loadTopics();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['attemptId'] && !changes['attemptId'].isFirstChange()) {
      this.loadTopics();
    }
  }

  loadTopics(): void {
    if (!this.attemptId) {
      this._topics.set([]);
      this._loading.set(false);
      return;
    }
    this._loading.set(true);

    this.analyticsApi.getAttemptTopics(this.attemptId).subscribe({
      next: (topics) => {
        this._topics.set(topics);
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
        this.notify.error('Failed to load topics');
      }
    });
  }

  getColorByPercentage(percentage: number): string {
    if (percentage >= 80) return '#22c55e'; // Green
    if (percentage >= 60) return '#3b82f6'; // Blue
    if (percentage >= 40) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  }

  onChartClick(event: any): void {
    const selected = this.chartData()[event?.dataIndex];
    if (!selected) return;
    this.dialog.open(TopicDrilldownComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: {
        attemptId: this.attemptId,
        topicId: selected.extra.topicId
      }
    });
  }
}

