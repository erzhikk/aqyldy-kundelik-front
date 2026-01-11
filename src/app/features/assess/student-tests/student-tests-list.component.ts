import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { TestsService, TestDto } from '../tests/tests.service';

/**
 * Student Tests List Component
 *
 * Shows available tests for students to take
 */
@Component({
  standalone: true,
  selector: 'app-student-tests-list',
  templateUrl: './student-tests-list.component.html',
  styleUrls: ['./student-tests-list.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    TranslateModule
  ]
})
export class StudentTestsListComponent implements OnInit {
  private testsApi = inject(TestsService);
  private router = inject(Router);

  private _tests = signal<TestDto[]>([]);
  tests = computed(() => this._tests());

  private _loading = signal(true);
  loading = computed(() => this._loading());

  ngOnInit(): void {
    this.loadAvailableTests();
  }

  /**
   * Load available published tests for student
   */
  loadAvailableTests(): void {
    this._loading.set(true);

    // Load only published tests
    this.testsApi.list({ published: true, size: 100 }).subscribe({
      next: (response) => {
        this._tests.set(response.content);
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
      }
    });
  }

  /**
   * Start test
   */
  startTest(test: TestDto): void {
    this.router.navigate(['/app/tests', test.id, 'start']);
  }

  /**
   * Format duration
   */
  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} мин`;
  }

  /**
   * Format date
   */
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'Не установлено';
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Check if test is available now
   */
  isTestAvailable(test: TestDto): boolean {
    const now = new Date();

    if (test.opensAt) {
      const opensAt = new Date(test.opensAt);
      if (now < opensAt) return false;
    }

    if (test.closesAt) {
      const closesAt = new Date(test.closesAt);
      if (now > closesAt) return false;
    }

    return true;
  }

  /**
   * Get test status
   */
  getTestStatus(test: TestDto): string {
    if (!this.isTestAvailable(test)) {
      const now = new Date();
      if (test.opensAt && now < new Date(test.opensAt)) {
        return 'Скоро откроется';
      }
      if (test.closesAt && now > new Date(test.closesAt)) {
        return 'Закрыт';
      }
    }
    return 'Доступен';
  }
}
