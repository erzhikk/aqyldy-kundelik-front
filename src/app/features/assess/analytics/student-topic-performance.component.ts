import { Component, Input, OnInit, OnChanges, SimpleChanges, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AnalyticsService, TopicPerformanceDto } from './analytics.service';
import { SubjectsService, SubjectDto } from '../../subjects/subjects.service';
import { NotifyService } from '../../../core/ui/notify.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export type TimePeriod = 'month' | 'quarter' | 'year';

interface PeriodOption {
  value: TimePeriod;
  label: string;
}

/**
 * Student Topic Performance Component
 *
 * Shows student performance breakdown by topics with filters
 */
@Component({
  standalone: true,
  selector: 'app-student-topic-performance',
  templateUrl: './student-topic-performance.component.html',
  styleUrls: ['./student-topic-performance.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class StudentTopicPerformanceComponent implements OnInit, OnChanges {
  @Input({ required: true }) studentId!: string;

  private analyticsApi = inject(AnalyticsService);
  private subjectsApi = inject(SubjectsService);
  private notify = inject(NotifyService);
  private destroyRef = inject(DestroyRef);

  // State signals
  private _topics = signal<TopicPerformanceDto[]>([]);
  topics = computed(() => this._topics());

  private _subjects = signal<SubjectDto[]>([]);
  subjects = computed(() => this._subjects());

  private _loading = signal(false);
  loading = computed(() => this._loading());

  // Form controls
  subjectControl = new FormControl<string | null>(null);
  periodControl = new FormControl<TimePeriod>('month');

  // Period options
  periodOptions: PeriodOption[] = [
    { value: 'month', label: 'Last Month' },
    { value: 'quarter', label: 'Last Quarter' },
    { value: 'year', label: 'Last Year' }
  ];

  ngOnInit(): void {
    this.loadSubjects();
    this.loadTopicPerformance();

    // Listen to filter changes
    this.subjectControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadTopicPerformance();
      });

    this.periodControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadTopicPerformance();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['studentId'] && !changes['studentId'].isFirstChange()) {
      this.loadTopicPerformance();
    }
  }

  /**
   * Load subjects for filter
   */
  loadSubjects(): void {
    this.subjectsApi.list().subscribe({
      next: (response) => {
        this._subjects.set(response);
      },
      error: () => {
        this.notify.error('Failed to load subjects');
      }
    });
  }

  /**
   * Load topic performance data
   */
  loadTopicPerformance(): void {
    if (!this.studentId) {
      this._loading.set(false);
      this._topics.set([]);
      return;
    }
    this._loading.set(true);

    const period = this.periodControl.value || 'month';
    const dateRange = this.getDateRange(period);

    this.analyticsApi.getStudentTopicPerformance(this.studentId, {
      subjectId: this.subjectControl.value || undefined,
      from: dateRange.from,
      to: dateRange.to
    }).subscribe({
      next: (topics) => {
        this._topics.set(topics);
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
        this.notify.error('Failed to load topic performance');
      }
    });
  }

  /**
   * Get date range based on period
   */
  getDateRange(period: TimePeriod): { from: string; to: string } {
    const now = new Date();
    const to = now.toISOString();
    let from: Date;

    switch (period) {
      case 'month':
        from = new Date(now);
        from.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        from = new Date(now);
        from.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        from = new Date(now);
        from.setFullYear(now.getFullYear() - 1);
        break;
    }

    return {
      from: from.toISOString(),
      to
    };
  }

  /**
   * Get chip color based on percentage
   */
  getChipColor(percentage: number): string {
    if (percentage >= 80) return 'primary';
    if (percentage >= 60) return 'accent';
    return 'warn';
  }

  /**
   * Check if topic is in red zone (below 60%)
   */
  isRedZone(percentage: number): boolean {
    return percentage < 60;
  }
}
