import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { AttemptsService, TestAttemptDto, AttemptQuestionDto, SaveAnswersBody } from '../attempts/attempts.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { NotifyService } from '../../../core/ui/notify.service';

/**
 * Test Taking Component
 *
 * Features:
 * - Countdown timer (auto-submit when time runs out)
 * - Question navigation with answered indicator
 * - Radio buttons for answer selection
 * - Autosave every N seconds
 * - Submit button with confirmation
 * - State preservation when switching questions
 */
@Component({
  standalone: true,
  selector: 'app-test-taking',
  templateUrl: './test-taking.component.html',
  styleUrls: ['./test-taking.component.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatProgressBarModule,
    MatChipsModule
  ]
})
export class TestTakingComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private attemptsApi = inject(AttemptsService);
  private notify = inject(NotifyService);

  // State signals
  private _attempt = signal<TestAttemptDto | null>(null);
  attempt = computed(() => this._attempt());

  private _currentQuestionIndex = signal(0);
  currentQuestionIndex = computed(() => this._currentQuestionIndex());

  private _remainingSeconds = signal(0);
  remainingSeconds = computed(() => this._remainingSeconds());

  private _loading = signal(false);
  loading = computed(() => this._loading());

  private _submitting = signal(false);
  submitting = computed(() => this._submitting());

  // Local state for answers (questionId -> choiceId)
  answers = new Map<string, string>();

  // Subscriptions
  private timerSub?: Subscription;
  private autosaveSub?: Subscription;

  // Config
  private readonly AUTOSAVE_INTERVAL = 30000; // 30 seconds

  ngOnInit(): void {
    const testId = this.route.snapshot.paramMap.get('id');
    if (testId) {
      this.startAttempt(testId);
    } else {
      this.notify.error('Test ID not provided');
      this.router.navigate(['/app']);
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.stopAutosave();
    // Save answers one last time on component destroy
    this.saveAnswersToServer(false);
  }

  /**
   * Start test attempt
   */
  startAttempt(testId: string): void {
    this._loading.set(true);
    this.attemptsApi.startAttempt(testId).subscribe({
      next: (attempt) => {
        this._attempt.set(attempt);
        this._remainingSeconds.set(attempt.durationSec);
        this._loading.set(false);
        this.startTimer();
        this.startAutosave();
      },
      error: () => {
        this._loading.set(false);
        this.notify.error('Failed to start test attempt');
        this.router.navigate(['/app']);
      }
    });
  }

  /**
   * Start countdown timer
   */
  startTimer(): void {
    this.stopTimer(); // Stop any existing timer

    this.timerSub = interval(1000).subscribe(() => {
      const remaining = this._remainingSeconds();
      if (remaining > 0) {
        this._remainingSeconds.set(remaining - 1);
      } else {
        // Time's up - auto submit
        this.stopTimer();
        this.stopAutosave();
        this.notify.warning('Time is up! Submitting test...');
        this.submitAttempt();
      }
    });
  }

  /**
   * Stop timer
   */
  stopTimer(): void {
    if (this.timerSub) {
      this.timerSub.unsubscribe();
      this.timerSub = undefined;
    }
  }

  /**
   * Start autosave
   */
  startAutosave(): void {
    this.stopAutosave(); // Stop any existing autosave

    this.autosaveSub = interval(this.AUTOSAVE_INTERVAL).subscribe(() => {
      this.saveAnswersToServer(false);
    });
  }

  /**
   * Stop autosave
   */
  stopAutosave(): void {
    if (this.autosaveSub) {
      this.autosaveSub.unsubscribe();
      this.autosaveSub = undefined;
    }
  }

  /**
   * Save answers to server
   */
  saveAnswersToServer(showNotification = true): void {
    const attempt = this._attempt();
    if (!attempt || this.answers.size === 0) return;

    const body: SaveAnswersBody = {
      answers: Array.from(this.answers.entries()).map(([questionId, choiceId]) => ({
        questionId,
        choiceId
      }))
    };

    this.attemptsApi.saveAnswers(attempt.attemptId, body).subscribe({
      next: () => {
        if (showNotification) {
          this.notify.success('Answers saved');
        }
      },
      error: () => {
        if (showNotification) {
          this.notify.error('Failed to save answers');
        }
      }
    });
  }

  /**
   * Get current question
   */
  getCurrentQuestion(): AttemptQuestionDto | null {
    const attempt = this._attempt();
    if (!attempt) return null;
    return attempt.questions[this._currentQuestionIndex()] || null;
  }

  /**
   * Get answer for question
   */
  getAnswer(questionId: string): string | null {
    return this.answers.get(questionId) || null;
  }

  /**
   * Set answer for question
   */
  setAnswer(questionId: string, choiceId: string): void {
    this.answers.set(questionId, choiceId);
  }

  /**
   * Check if question is answered
   */
  isQuestionAnswered(questionIndex: number): boolean {
    const attempt = this._attempt();
    if (!attempt) return false;
    const question = attempt.questions[questionIndex];
    return this.answers.has(question.id);
  }

  /**
   * Navigate to question
   */
  goToQuestion(index: number): void {
    const attempt = this._attempt();
    if (!attempt) return;
    if (index >= 0 && index < attempt.questions.length) {
      this._currentQuestionIndex.set(index);
    }
  }

  /**
   * Go to previous question
   */
  previousQuestion(): void {
    const index = this._currentQuestionIndex();
    if (index > 0) {
      this._currentQuestionIndex.set(index - 1);
    }
  }

  /**
   * Go to next question
   */
  nextQuestion(): void {
    const attempt = this._attempt();
    if (!attempt) return;
    const index = this._currentQuestionIndex();
    if (index < attempt.questions.length - 1) {
      this._currentQuestionIndex.set(index + 1);
    }
  }

  /**
   * Get answered count
   */
  getAnsweredCount(): number {
    return this.answers.size;
  }

  /**
   * Get total questions count
   */
  getTotalQuestions(): number {
    return this._attempt()?.questions.length || 0;
  }

  /**
   * Submit attempt
   */
  submitAttempt(): void {
    const attempt = this._attempt();
    if (!attempt) return;

    const answered = this.getAnsweredCount();
    const total = this.getTotalQuestions();

    if (answered < total) {
      const confirmed = confirm(
        `You have answered ${answered} out of ${total} questions. ` +
        `Are you sure you want to submit?`
      );
      if (!confirmed) return;
    } else {
      const confirmed = confirm('Submit your test? You cannot change answers after submitting.');
      if (!confirmed) return;
    }

    this._submitting.set(true);
    this.stopTimer();
    this.stopAutosave();

    // Save answers one last time before submit
    this.saveAnswersToServer(false);

    // Wait a bit for autosave to complete, then submit
    setTimeout(() => {
      this.attemptsApi.submitAttempt(attempt.attemptId).subscribe({
        next: (result) => {
          this._submitting.set(false);
          this.notify.success('Test submitted successfully!');
          // Navigate to result page
          this.router.navigate(['/app/attempts', attempt.attemptId, 'result']);
        },
        error: () => {
          this._submitting.set(false);
          this.notify.error('Failed to submit test');
          // Restart timer if submission failed
          this.startTimer();
          this.startAutosave();
        }
      });
    }, 1000);
  }

  /**
   * Format time for display (MM:SS)
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get timer color based on remaining time
   */
  getTimerColor(): string {
    const remaining = this._remainingSeconds();
    const attempt = this._attempt();
    if (!attempt) return 'primary';

    const percentage = (remaining / attempt.durationSec) * 100;
    if (percentage <= 10) return 'warn';
    if (percentage <= 25) return 'accent';
    return 'primary';
  }

  /**
   * Check if on last question
   */
  isLastQuestion(): boolean {
    const attempt = this._attempt();
    if (!attempt) return false;
    return this._currentQuestionIndex() === attempt.questions.length - 1;
  }

  /**
   * Check if on first question
   */
  isFirstQuestion(): boolean {
    return this._currentQuestionIndex() === 0;
  }
}
