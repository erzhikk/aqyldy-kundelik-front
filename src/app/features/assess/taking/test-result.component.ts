import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AttemptsService, AttemptResultDto } from '../attempts/attempts.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NotifyService } from '../../../core/ui/notify.service';

/**
 * Test Result Component
 *
 * Shows test attempt result:
 * - Score and percentage
 * - Pass/fail status
 * - Optional answer review (if reviewAllowed)
 * - Correct/incorrect answers with explanations
 */
@Component({
  standalone: true,
  selector: 'app-test-result',
  templateUrl: './test-result.component.html',
  styleUrls: ['./test-result.component.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressBarModule
  ]
})
export class TestResultComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private attemptsApi = inject(AttemptsService);
  private notify = inject(NotifyService);

  // State signals
  private _result = signal<AttemptResultDto | null>(null);
  result = computed(() => this._result());

  private _loading = signal(true);
  loading = computed(() => this._loading());

  ngOnInit(): void {
    const attemptId = this.route.snapshot.paramMap.get('attemptId');
    if (attemptId) {
      this.loadResult(attemptId);
    } else {
      this.notify.error('Attempt ID not provided');
      this.router.navigate(['/app']);
    }
  }

  /**
   * Load result from server
   */
  loadResult(attemptId: string): void {
    this._loading.set(true);
    this.attemptsApi.getResult(attemptId).subscribe({
      next: (result) => {
        this._result.set(result);
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
        this.notify.error('Failed to load test result');
        this.router.navigate(['/app']);
      }
    });
  }

  /**
   * Get pass/fail status
   */
  isPassed(): boolean {
    const result = this._result();
    if (!result) return false;
    return result.percentage >= 50; // 50% to pass
  }

  /**
   * Get status text
   */
  getStatusText(): string {
    return this.isPassed() ? 'Passed' : 'Failed';
  }

  /**
   * Get status color
   */
  getStatusColor(): string {
    return this.isPassed() ? 'primary' : 'warn';
  }

  /**
   * Get correct answers count
   */
  getCorrectCount(): number {
    const result = this._result();
    if (!result || !result.answers) return 0;
    return result.answers.filter(a => a.isCorrect).length;
  }

  /**
   * Get incorrect answers count
   */
  getIncorrectCount(): number {
    const result = this._result();
    if (!result || !result.answers) return 0;
    return result.answers.filter(a => !a.isCorrect).length;
  }

  /**
   * Go back to dashboard
   */
  goToDashboard(): void {
    this.router.navigate(['/app']);
  }
}
