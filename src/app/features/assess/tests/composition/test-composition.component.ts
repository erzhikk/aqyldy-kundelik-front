import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { TestsService, TestDto, TestQuestionDto, AddQuestionsToTestBody } from '../tests.service';
import { QuestionsService, QuestionDto, QuestionDifficulty } from '../../questions/questions.service';
import { TopicsService, TopicDto } from '../../topics/topics.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { NotifyService } from '../../../../core/ui/notify.service';

/**
 * Test Composition Component
 *
 * Two-panel interface for managing test questions:
 * Left: Filterable question bank (by topic/difficulty)
 * Right: Test "basket" (sortable list) with weight and order
 *
 * Features:
 * - Add questions from bank to test
 * - Remove questions from test
 * - Drag-and-drop reordering
 * - Set question weight
 * - Cannot add questions from different subject
 * - Cannot edit published test composition
 */
@Component({
  standalone: true,
  selector: 'app-test-composition',
  templateUrl: './test-composition.component.html',
  styleUrls: ['./test-composition.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DragDropModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatTooltipModule,
    MatDividerModule
  ]
})
export class TestCompositionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private testsApi = inject(TestsService);
  private questionsApi = inject(QuestionsService);
  private topicsApi = inject(TopicsService);
  private notify = inject(NotifyService);

  // State signals
  private _test = signal<TestDto | null>(null);
  test = computed(() => this._test());

  private _testQuestions = signal<TestQuestionDto[]>([]);
  testQuestions = computed(() => this._testQuestions());

  private _availableQuestions = signal<QuestionDto[]>([]);
  availableQuestions = computed(() => this._availableQuestions());

  private _topics = signal<TopicDto[]>([]);
  topics = computed(() => this._topics());

  private _loading = signal(false);
  loading = computed(() => this._loading());

  // Filters
  topicFilter = new FormControl<string | null>(null);
  difficultyFilter = new FormControl<QuestionDifficulty | null>(null);
  searchControl = new FormControl<string>('');

  // Difficulty options
  difficulties: QuestionDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];

  // Temporary weights for questions (questionId -> weight)
  questionWeights = new Map<string, number>();

  ngOnInit(): void {
    const testId = this.route.snapshot.paramMap.get('id');
    if (testId) {
      this.loadTest(testId);
      this.loadTestQuestions(testId);
    } else {
      this.notify.error('Test ID not provided');
      this.goBack();
    }

    // Watch filter changes
    this.topicFilter.valueChanges.subscribe(() => this.loadAvailableQuestions());
    this.difficultyFilter.valueChanges.subscribe(() => this.loadAvailableQuestions());
    this.searchControl.valueChanges.subscribe(() => this.loadAvailableQuestions());
  }

  /**
   * Load test data
   */
  loadTest(id: string): void {
    this.testsApi.getOne(id).subscribe({
      next: (test) => {
        this._test.set(test);
        // Load topics for this test's subject
        this.loadTopics(test.subjectId);
        // Load available questions
        this.loadAvailableQuestions();
      },
      error: () => {
        this.notify.error('Failed to load test');
        this.goBack();
      }
    });
  }

  /**
   * Load test questions (composition)
   */
  loadTestQuestions(testId: string): void {
    this.testsApi.getTestQuestions(testId).subscribe({
      next: (questions) => {
        this._testQuestions.set(questions);
        // Initialize weights
        questions.forEach(q => {
          this.questionWeights.set(q.questionId, q.weight);
        });
      },
      error: () => {
        this.notify.error('Failed to load test composition');
      }
    });
  }

  /**
   * Load topics for subject
   */
  loadTopics(subjectId: string): void {
    this.topicsApi.list({ subjectId }).subscribe({
      next: (topics) => {
        this._topics.set(topics);
      }
    });
  }

  /**
   * Load available questions from bank
   */
  loadAvailableQuestions(): void {
    const test = this._test();
    if (!test) return;

    this.questionsApi.list({
      subjectId: test.subjectId,
      topicId: this.topicFilter.value || undefined,
      difficulty: this.difficultyFilter.value || undefined,
      q: this.searchControl.value || undefined,
      size: 50
    }).subscribe({
      next: (response) => {
        // Filter out questions already in test
        const testQuestionIds = new Set(this._testQuestions().map(tq => tq.questionId));
        const filtered = (response.content || []).filter(q => !testQuestionIds.has(q.id));
        this._availableQuestions.set(filtered);
      }
    });
  }

  /**
   * Add question to test
   */
  addQuestionToTest(question: QuestionDto): void {
    if (this.isPublished()) {
      this.notify.warning('Cannot modify published test');
      return;
    }

    const testQuestions = this._testQuestions();
    const newOrder = testQuestions.length;
    const weight = 1; // Default weight

    // Add to local state immediately for UI responsiveness
    const newTestQuestion: TestQuestionDto = {
      id: '', // Will be assigned by server
      questionId: question.id,
      questionText: question.text,
      order: newOrder,
      weight: weight
    };

    this._testQuestions.set([...testQuestions, newTestQuestion]);
    this.questionWeights.set(question.id, weight);

    // Remove from available questions
    const available = this._availableQuestions();
    this._availableQuestions.set(available.filter(q => q.id !== question.id));

    this.notify.success('Question added to test');
  }

  /**
   * Remove question from test
   */
  removeQuestionFromTest(testQuestion: TestQuestionDto): void {
    if (this.isPublished()) {
      this.notify.warning('Cannot modify published test');
      return;
    }

    const testQuestions = this._testQuestions();
    this._testQuestions.set(testQuestions.filter(tq => tq.questionId !== testQuestion.questionId));
    this.questionWeights.delete(testQuestion.questionId);

    // Reload available questions to include removed question
    this.loadAvailableQuestions();

    this.notify.success('Question removed from test');
  }

  /**
   * Handle drag and drop reordering
   */
  onDrop(event: CdkDragDrop<TestQuestionDto[]>): void {
    if (this.isPublished()) {
      this.notify.warning('Cannot modify published test');
      return;
    }

    const testQuestions = [...this._testQuestions()];
    moveItemInArray(testQuestions, event.previousIndex, event.currentIndex);

    // Update order
    testQuestions.forEach((q, index) => {
      q.order = index;
    });

    this._testQuestions.set(testQuestions);
  }

  /**
   * Update question weight
   */
  updateWeight(questionId: string, weight: number): void {
    if (weight < 0) weight = 0;
    if (weight > 10) weight = 10;
    this.questionWeights.set(questionId, weight);
  }

  /**
   * Get weight for question
   */
  getWeight(questionId: string): number {
    return this.questionWeights.get(questionId) || 1;
  }

  /**
   * Save composition to server
   */
  saveComposition(): void {
    const test = this._test();
    if (!test) return;

    if (this.isPublished()) {
      this.notify.warning('Cannot modify published test');
      return;
    }

    this._loading.set(true);

    const body: AddQuestionsToTestBody = {
      questions: this._testQuestions().map(tq => ({
        questionId: tq.questionId,
        order: tq.order,
        weight: this.getWeight(tq.questionId)
      }))
    };

    this.testsApi.addQuestionsToTest(test.id, body).subscribe({
      next: () => {
        this._loading.set(false);
        this.notify.success('Test composition saved successfully');
        // Reload to get server IDs
        this.loadTestQuestions(test.id);
      },
      error: () => {
        this._loading.set(false);
        this.notify.error('Failed to save composition');
      }
    });
  }

  /**
   * Calculate total score
   */
  getTotalScore(): number {
    return this._testQuestions().reduce((sum, tq) => sum + this.getWeight(tq.questionId), 0);
  }

  /**
   * Check if test is published
   */
  isPublished(): boolean {
    return this._test()?.published || false;
  }

  /**
   * Go back to test form
   */
  goBack(): void {
    const test = this._test();
    if (test) {
      this.router.navigate(['/app/assess/tests', test.id, 'edit']);
    } else {
      this.router.navigate(['/app/assess/tests']);
    }
  }

  /**
   * Get difficulty badge color
   */
  getDifficultyColor(difficulty: QuestionDifficulty): string {
    switch (difficulty) {
      case 'EASY': return 'primary';
      case 'MEDIUM': return 'accent';
      case 'HARD': return 'warn';
      default: return 'primary';
    }
  }
}
