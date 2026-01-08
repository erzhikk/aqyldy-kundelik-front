import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { TestsService, TestDto, TestQuestionDto } from '../tests.service';
import { QuestionViewDialogComponent } from '../../questions/view/question-view-dialog.component';
import { QuestionsService, QuestionDto } from '../../questions/questions.service';

@Component({
  standalone: true,
  selector: 'app-test-card',
  templateUrl: './test-card.component.html',
  styleUrls: ['./test-card.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslateModule
  ]
})
export class TestCardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private testsApi = inject(TestsService);
  private questionsApi = inject(QuestionsService);
  private dialog = inject(MatDialog);

  testId = '';

  private _test = signal<TestDto | null>(null);
  test = computed(() => this._test());

  private _questions = signal<TestQuestionDto[]>([]);
  questions = computed(() => this._questions());

  private _loading = signal(true);
  loading = computed(() => this._loading());

  private _error = signal<string | null>(null);
  error = computed(() => this._error());

  displayedColumns = ['order', 'question', 'weight', 'actions'];

  ngOnInit(): void {
    const testId = this.route.snapshot.paramMap.get('id');
    if (!testId) {
      this._error.set('Test ID is missing');
      this._loading.set(false);
      return;
    }

    this.testId = testId;
    this.loadTest();
  }

  loadTest(): void {
    this._loading.set(true);
    this.testsApi.getOne(this.testId).subscribe({
      next: (test) => {
        this._test.set(test);
        // API возвращает вопросы в поле questions
        this._questions.set(test.questions || []);
        this._loading.set(false);
      },
      error: () => {
        this._error.set('Failed to load test');
        this._loading.set(false);
      }
    });
  }

  viewQuestion(testQuestion: TestQuestionDto): void {
    // Fetch full question details
    this.questionsApi.getOne(testQuestion.questionId).subscribe({
      next: (question) => {
        this.dialog.open(QuestionViewDialogComponent, {
          width: '600px',
          maxWidth: '95vw',
          data: { question }
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/app/assess/tests']);
  }

  editTest(): void {
    this.router.navigate(['/app/assess/tests', this.testId, 'edit']);
  }

  manageQuestions(): void {
    this.router.navigate(['/app/assess/tests', this.testId, 'composition']);
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isPublished(test: TestDto): boolean {
    if (typeof test.published === 'boolean') return test.published;
    return test.status === 'PUBLISHED';
  }
}
