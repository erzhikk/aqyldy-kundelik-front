import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { TestsService, TestDto, TestQuestionDto, TestTopicDto, AddQuestionsToTestBody, TestPlan, TopicPlan, PlanProgress, TopicProgress } from '../tests.service';
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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { NotifyService } from '../../../../core/ui/notify.service';
import { QuestionViewDialogComponent } from '../../questions/view/question-view-dialog.component';
import { AddTopicsDialogComponent } from './add-topics-dialog.component';

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
    MatDividerModule,
    MatProgressBarModule,
    MatCheckboxModule
  ]
})
export class TestCompositionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private testsApi = inject(TestsService);
  private questionsApi = inject(QuestionsService);
  private topicsApi = inject(TopicsService);
  private notify = inject(NotifyService);
  private dialog = inject(MatDialog);

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

  // Test plan state (stored in sessionStorage)
  private _testPlan = signal<TestPlan | null>(null);
  testPlan = computed(() => this._testPlan());

  // Grouped available questions by topic for Question Bank
  groupedAvailableQuestions = computed(() => {
    const questions = this._availableQuestions();
    const plan = this._testPlan();
    const topics = this._topics();

    if (!plan || plan.topicPlans.length === 0) {
      return [];
    }

    // Group questions by topic
    const groups: { topicId: string; topicName: string; questions: QuestionDto[] }[] = [];

    plan.topicPlans.forEach(tp => {
      const topicQuestions = questions.filter(q => q.topicId === tp.topicId);

      groups.push({
        topicId: tp.topicId,
        topicName: tp.topicName,
        questions: topicQuestions
      });
    });

    return groups;
  });

  // Grouped questions by topic for display
  groupedTestQuestions = computed(() => {
    const questions = this._testQuestions();
    const plan = this._testPlan();

    console.log('🔍 groupedTestQuestions computed - questions:', questions.length, ', plan:', plan);

    // If no plan, show all questions in a single group
    if (!plan || plan.topicPlans.length === 0) {
      if (questions.length === 0) return [];

      // Group by topicId if available, otherwise single group
      const topicMap = new Map<string, TestQuestionDto[]>();

      questions.forEach(q => {
        const topicId = q.topicId || 'unknown';
        if (!topicMap.has(topicId)) {
          topicMap.set(topicId, []);
        }
        topicMap.get(topicId)!.push(q);
      });

      const groups: { topicId: string; topicName: string; questions: TestQuestionDto[] }[] = [];
      topicMap.forEach((topicQuestions, topicId) => {
        topicQuestions.sort((a, b) => a.order - b.order);
        const topic = this._topics().find(t => t.id === topicId);
        groups.push({
          topicId: topicId,
          topicName: topic?.name || 'Вопросы',
          questions: topicQuestions
        });
      });

      return groups;
    }

    // With plan: group according to plan
    const groups: { topicId: string; topicName: string; questions: TestQuestionDto[] }[] = [];

    plan.topicPlans.forEach(tp => {
      console.log('📋 Topic plan:', tp.topicName, '- Selected IDs:', tp.selectedQuestionIds);

      const topicQuestions = questions.filter(q => {
        const questionInPlan = tp.selectedQuestionIds.includes(q.questionId);
        console.log('  ❓ Question', q.questionId, 'in plan?', questionInPlan);
        return questionInPlan;
      });

      console.log('  ✅ Filtered questions for', tp.topicName, ':', topicQuestions.length);

      topicQuestions.sort((a, b) => a.order - b.order);

      groups.push({
        topicId: tp.topicId,
        topicName: tp.topicName,
        questions: topicQuestions
      });
    });

    console.log('📊 Final groups:', groups);
    return groups;
  });

  // Temporary weights for questions (questionId -> weight)
  questionWeights = new Map<string, number>();

  // Collapsed topics state - separate for each panel
  collapsedQuestionBankTopics = new Set<string>();
  collapsedTestTopics = new Set<string>();

  ngOnInit(): void {
    console.log('🚀 ngOnInit called');
    const testId = this.route.snapshot.paramMap.get('id');
    console.log('📋 Test ID from route:', testId);

    if (testId) {
      console.log('⏳ Loading plan from sessionStorage');
      this.loadPlanFromSessionStorage(testId);
      console.log('⏳ Loading test data (includes questions)');
      this.loadTest(testId);
    } else {
      this.notify.error('Test ID not provided');
      this.goBack();
    }
  }

  /**
   * Load test data
   */
  loadTest(id: string): void {
    console.log('📥 loadTest called with id:', id);
    this.testsApi.getOne(id).subscribe({
      next: (test) => {
        console.log('✅ Test data loaded:', test);
        this._test.set(test);

        // Parse topics structure to flat array of questions
        const topics = test.topics || [];
        console.log('✅ Topics from response:', topics.length, 'topics', topics);

        const allQuestions: TestQuestionDto[] = [];
        let orderCounter = 0;

        topics.forEach(topic => {
          topic.questions.forEach(q => {
            // Add topicId to each question and map text field
            allQuestions.push({
              ...q,
              topicId: topic.topicId,
              questionText: q.text, // Map text to questionText for compatibility
              order: orderCounter++
            });
          });
        });

        console.log('✅ Parsed questions:', allQuestions.length, 'questions', allQuestions);
        this._testQuestions.set(allQuestions);

        // Initialize weights
        allQuestions.forEach(q => {
          this.questionWeights.set(q.questionId, q.weight);
        });

        // Load topics list for this test's subject
        console.log('⏳ Loading topics for subject:', test.subjectId);
        this.loadTopics(test.subjectId, topics);

        // Load available questions
        console.log('⏳ Loading available questions');
        this.loadAvailableQuestions();
      },
      error: (err) => {
        console.error('❌ Failed to load test:', err);
        this.notify.error('Failed to load test');
        this.goBack();
      }
    });
  }

  /**
   * Load topics for subject
   */
  loadTopics(subjectId: string, testTopics: TestTopicDto[]): void {
    console.log('📥 loadTopics called with subjectId:', subjectId, 'and', testTopics.length, 'test topics');
    this.topicsApi.list({ subjectId }).subscribe({
      next: (topics) => {
        console.log('✅ Topics loaded:', topics.length, 'topics');
        this._topics.set(topics);

        // After topics loaded, create plan from test topics if needed
        console.log('📊 Test topics to process:', testTopics.length);
        if (testTopics.length > 0) {
          console.log('🔄 Calling createPlanFromTestTopics');
          this.createPlanFromTestTopics(testTopics);
        } else {
          console.log('⚠️ No test topics to create plan from');
        }
      },
      error: (err) => {
        console.error('❌ Failed to load topics:', err);
      }
    });
  }

  /**
   * Load available questions from bank (all topics from plan)
   */
  loadAvailableQuestions(): void {
    const test = this._test();
    const plan = this._testPlan();

    if (!test) return;

    // If plan exists, load questions from plan topics
    if (plan && plan.topicPlans.length > 0) {
      const topicIds = plan.topicPlans.map(tp => tp.topicId);

      this.questionsApi.getByTopics(topicIds, {
        subjectId: test.subjectId,
        size: 1000
      }).subscribe({
        next: (questions) => {
          this._availableQuestions.set(questions);

          // After loading available questions, sync with plan
          this.syncTestQuestionsWithPlan();
        },
        error: (error) => {
          console.error('Error loading questions:', error);
          this._availableQuestions.set([]);
        }
      });
    } else {
      // No plan: don't load questions in bank, user needs to create plan first
      this._availableQuestions.set([]);
    }
  }

  /**
   * Sync test questions with plan after loading
   * Restores locally selected questions that weren't saved to backend
   */
  private syncTestQuestionsWithPlan(): void {
    const plan = this._testPlan();
    const testQuestions = this._testQuestions();
    const availableQuestions = this._availableQuestions();

    if (!plan) return;

    // Collect all question IDs that should be in test according to plan
    const plannedQuestionIds = new Set<string>();
    plan.topicPlans.forEach(tp => {
      tp.selectedQuestionIds.forEach(id => plannedQuestionIds.add(id));
    });

    // Find questions that are in plan but not in testQuestions
    const existingTestQuestionIds = new Set(testQuestions.map(tq => tq.questionId));
    const missingQuestionIds = Array.from(plannedQuestionIds).filter(id => !existingTestQuestionIds.has(id));

    if (missingQuestionIds.length === 0) {
      return;
    }

    // Restore missing questions from available questions
    const restoredQuestions: TestQuestionDto[] = [];
    missingQuestionIds.forEach(questionId => {
      const question = availableQuestions.find(q => q.id === questionId);
      if (question) {
        const newTestQuestion: TestQuestionDto = {
          id: '', // Will be assigned when saved
          questionId: question.id,
          questionText: question.text,
          order: testQuestions.length + restoredQuestions.length,
          weight: 1
        };
        restoredQuestions.push(newTestQuestion);
        this.questionWeights.set(question.id, 1);
      }
    });

    if (restoredQuestions.length > 0) {
      this._testQuestions.set([...testQuestions, ...restoredQuestions]);
      this.redistributeWeights(); // Recalculate weights after restoration
      this.notify.info(`Восстановлено ${restoredQuestions.length} несохранённых вопросов из плана`);
    }
  }

  /**
   * Redistribute weights evenly across all questions (total = 100)
   * Remainder goes to HARD questions, then MEDIUM, then EASY
   */
  redistributeWeights(): void {
    const testQuestions = this._testQuestions();
    const count = testQuestions.length;

    if (count === 0) return;

    // Calculate base weight per question (floor to avoid exceeding 100)
    const baseWeight = Math.floor(100 / count);
    const remainder = 100 - (baseWeight * count);

    // Sort questions by difficulty priority: HARD > MEDIUM > EASY
    const sortedQuestions = [...testQuestions].sort((a, b) => {
      const difficultyOrder: Record<QuestionDifficulty, number> = { HARD: 0, MEDIUM: 1, EASY: 2 };
      const getDifficultyOrder = (difficulty?: string): number => {
        if (difficulty === 'HARD' || difficulty === 'MEDIUM' || difficulty === 'EASY') {
          return difficultyOrder[difficulty];
        }
        return 1;
      };
      const aDiff = getDifficultyOrder(a.difficulty);
      const bDiff = getDifficultyOrder(b.difficulty);
      return aDiff - bDiff;
    });

    // Update weights for all questions
    const updatedQuestions = testQuestions.map((tq, index) => {
      // Find index in sorted array to determine if this question gets extra points
      const sortedIndex = sortedQuestions.findIndex(sq => sq.questionId === tq.questionId);
      const extraPoints = sortedIndex < remainder ? 1 : 0;
      const weight = baseWeight + extraPoints;

      this.questionWeights.set(tq.questionId, weight);
      return {
        ...tq,
        weight: weight
      };
    });

    this._testQuestions.set(updatedQuestions);
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

    // Add to local state immediately for UI responsiveness
    const newTestQuestion: TestQuestionDto = {
      id: '', // Will be assigned by server
      questionId: question.id,
      questionText: question.text,
      order: newOrder,
      weight: 1 // Will be recalculated
    };

    this._testQuestions.set([...testQuestions, newTestQuestion]);

    // Sync with plan
    const plan = this._testPlan();
    if (plan) {
      const topicPlan = plan.topicPlans.find(tp => tp.topicId === question.topicId);
      if (topicPlan && !topicPlan.selectedQuestionIds.includes(question.id)) {
        topicPlan.selectedQuestionIds.push(question.id);
        plan.updatedAt = new Date().toISOString();
        this._testPlan.set({...plan});
        this.savePlanToSessionStorage();
      }
    }

    // Recalculate weights for all questions
    this.redistributeWeights();
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

    // Sync with plan
    const plan = this._testPlan();
    if (plan) {
      plan.topicPlans.forEach(tp => {
        const index = tp.selectedQuestionIds.indexOf(testQuestion.questionId);
        if (index > -1) {
          tp.selectedQuestionIds.splice(index, 1);
        }
      });
      plan.updatedAt = new Date().toISOString();
      this._testPlan.set({...plan});
      this.savePlanToSessionStorage();
    }

    // Recalculate weights for remaining questions
    this.redistributeWeights();
  }

  /**
   * Get count of available questions for a topic
   */
  getAvailableQuestionsCount(topicId: string): number {
    return this._availableQuestions().filter(q => q.topicId === topicId).length;
  }

  /**
   * Check if question is selected (in test)
   */
  isQuestionSelected(questionId: string): boolean {
    return this._testQuestions().some(tq => tq.questionId === questionId);
  }

  /**
   * Handle checkbox toggle for question
   */
  onQuestionCheckboxChange(question: QuestionDto, checked: boolean): void {
    if (checked) {
      this.addQuestionToTest(question);
    } else {
      const testQuestion = this._testQuestions().find(tq => tq.questionId === question.id);
      if (testQuestion) {
        this.removeQuestionFromTest(testQuestion);
      }
    }
  }

  /**
   * Open dialog to view question details with answers
   */
  viewQuestion(question: QuestionDto): void {
    this.dialog.open(QuestionViewDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { question }
    });
  }

  /**
   * View test question in dialog (convert TestQuestionDto to QuestionDto)
   */
  viewTestQuestion(testQuestion: TestQuestionDto): void {
    // Check if question data is already included in the response
    if (testQuestion.choices && testQuestion.choices.length > 0) {
      // Use existing data - no need for additional API call
      const question: QuestionDto = {
        id: testQuestion.questionId,
        text: testQuestion.text || testQuestion.questionText || '',
        topicId: testQuestion.topicId || '',
        difficulty: (testQuestion.difficulty as any) || 'MEDIUM',
        choices: testQuestion.choices,
        explanation: testQuestion.explanation || null,
        mediaId: null,
        createdAt: '',
        updatedAt: ''
      };

      this.dialog.open(QuestionViewDialogComponent, {
        width: '600px',
        maxWidth: '95vw',
        data: { question }
      });
    } else {
      // Fallback: Fetch full question details if not included
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
        // Reload to get server IDs and updated data
        this.loadTest(test.id);
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
    const test = this._test();
    if (!test) return false;
    if (typeof test.published === 'boolean') return test.published;
    return test.status === 'PUBLISHED';
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

  // ===================
  // PLAN MANAGEMENT
  // ===================

  /**
   * Add topic to plan
   */
  addTopicToPlan(topicId: string, targetCount: number): void {
    const topic = this._topics().find(t => t.id === topicId);
    if (!topic) return;

    let plan = this._testPlan();

    if (!plan) {
      const test = this._test();
      if (!test) return;

      plan = {
        testId: test.id,
        subjectId: test.subjectId,
        topicPlans: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    if (plan.topicPlans.some(tp => tp.topicId === topicId)) {
      this.notify.warning('Топик уже добавлен в план');
      return;
    }

    plan.topicPlans.push({
      topicId: topic.id,
      topicName: topic.name,
      targetCount: targetCount,
      selectedQuestionIds: []
    });

    plan.updatedAt = new Date().toISOString();

    this._testPlan.set({...plan});
    this.savePlanToSessionStorage();
  }

  /**
   * Remove topic from plan
   */
  removeTopicFromPlan(topicId: string): void {
    const plan = this._testPlan();
    if (!plan) return;

    const topicPlan = plan.topicPlans.find(tp => tp.topicId === topicId);
    if (!topicPlan) return;

    const questionsToRemove = this._testQuestions().filter(tq =>
      topicPlan.selectedQuestionIds.includes(tq.questionId)
    );

    questionsToRemove.forEach(tq => this.removeQuestionFromTest(tq));

    plan.topicPlans = plan.topicPlans.filter(tp => tp.topicId !== topicId);
    plan.updatedAt = new Date().toISOString();

    this._testPlan.set({...plan});
    this.savePlanToSessionStorage();
    this.loadAvailableQuestions(); // Reload questions when topic removed
    this.notify.success('Топик удален из плана');
  }

  /**
   * Update topic target count
   */
  updateTopicTargetCount(topicId: string, count: number): void {
    const plan = this._testPlan();
    if (!plan) return;

    const topicPlan = plan.topicPlans.find(tp => tp.topicId === topicId);
    if (!topicPlan) return;

    if (count < 1) count = 1;
    if (count > 50) count = 50;

    topicPlan.targetCount = count;
    plan.updatedAt = new Date().toISOString();

    this._testPlan.set({...plan});
    this.savePlanToSessionStorage();
  }

  /**
   * Open dialog to add topics to plan
   */
  openAddTopicDialog(): void {
    const plan = this._testPlan();
    const topics = this._topics();

    const availableTopics = topics.filter(t =>
      !plan?.topicPlans.some(tp => tp.topicId === t.id)
    );

    if (availableTopics.length === 0) {
      this.notify.info('Все топики уже добавлены в план');
      return;
    }

    const dialogRef = this.dialog.open(AddTopicsDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: { availableTopics }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.selectedTopics && result.selectedTopics.length > 0) {
        // Add each selected topic to the plan
        result.selectedTopics.forEach((item: { topicId: string; topicName: string; targetCount: number }) => {
          this.addTopicToPlan(item.topicId, item.targetCount);
        });

        // Reload questions and show notification
        this.loadAvailableQuestions();

        const count = result.selectedTopics.length;
        const message = count === 1
          ? 'Топик добавлен в план'
          : `Добавлено топиков: ${count}`;
        this.notify.success(message);
      }
    });
  }

  /**
   * Check if there are topics in plan
   */
  hasTopicsInPlan(): boolean {
    const plan = this._testPlan();
    return !!plan && plan.topicPlans.length > 0;
  }

  // ===================
  // QUESTION GENERATION
  // ===================

  /**
   * Generate questions automatically based on plan
   */
  generateQuestionsAutomatically(): void {
    const plan = this._testPlan();
    if (!plan || this.isPublished()) return;

    this._loading.set(true);

    const promises = plan.topicPlans.map((topicPlan) => {
      const needed = topicPlan.targetCount - topicPlan.selectedQuestionIds.length;
      if (needed <= 0) return Promise.resolve(null);

      return this.questionsApi.list({
        topicId: topicPlan.topicId,
        subjectId: plan.subjectId,
        size: 100
      }).toPromise();
    });

    Promise.all(promises).then(responses => {
      let totalAdded = 0;

      responses.forEach((response, index) => {
        if (!response) {
          console.log('Response is null for index', index);
          return;
        }

        const topicPlan = plan.topicPlans[index];
        const needed = topicPlan.targetCount - topicPlan.selectedQuestionIds.length;

        console.log('Topic:', topicPlan.topicName);
        console.log('Needed:', needed);
        console.log('Response:', response);
        console.log('Response content:', response.content);

        if (needed <= 0) {
          console.log('Skipping - already filled');
          return;
        }

        const testQuestionIds = new Set(this._testQuestions().map(tq => tq.questionId));
        const available = (response.content || []).filter(q =>
          !testQuestionIds.has(q.id)
        );

        console.log('Available questions after filter:', available.length);
        console.log('Available questions:', available);

        const shuffled = this.shuffleArray([...available]);
        const toAdd = shuffled.slice(0, needed);

        console.log('Questions to add:', toAdd.length);

        toAdd.forEach(q => {
          this.addQuestionToTest(q);
          totalAdded++;
        });
      });

      plan.updatedAt = new Date().toISOString();
      this._testPlan.set({...plan});
      this.savePlanToSessionStorage();

      this._loading.set(false);

      if (totalAdded > 0) {
        this.notify.success(`Добавлено ${totalAdded} вопросов`);
      } else {
        this.notify.info('Нет доступных вопросов для добавления');
      }
    }).catch(() => {
      this._loading.set(false);
      this.notify.error('Ошибка при генерации вопросов');
    });
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // ===================
  // PLAN STORAGE
  // ===================

  /**
   * Save plan to sessionStorage
   */
  savePlanToSessionStorage(): void {
    const plan = this._testPlan();
    if (!plan) return;

    const key = `testPlan_${plan.testId}`;
    sessionStorage.setItem(key, JSON.stringify(plan));
  }

  /**
   * Load plan from sessionStorage
   */
  loadPlanFromSessionStorage(testId: string): void {
    const key = `testPlan_${testId}`;
    const stored = sessionStorage.getItem(key);

    if (stored) {
      try {
        const plan: TestPlan = JSON.parse(stored);
        this._testPlan.set(plan);
      } catch (e) {
        console.error('Failed to parse test plan:', e);
      }
    }
  }

  /**
   * Create plan from test topics (new backend structure)
   */
  createPlanFromTestTopics(testTopics: TestTopicDto[]): void {
    console.log('🏗️ createPlanFromTestTopics called with', testTopics.length, 'topics');

    const existingPlan = this._testPlan();
    console.log('📋 Existing plan:', existingPlan);

    // Don't override if plan already exists
    if (existingPlan && existingPlan.topicPlans.length > 0) {
      console.log('⏭️ Plan already exists, skipping');
      return;
    }

    const test = this._test();
    if (!test) {
      console.log('⚠️ Test not loaded yet');
      return;
    }

    console.log('✅ Creating plan from', testTopics.length, 'topics');

    // Create topic plans from backend structure
    const topicPlans: TopicPlan[] = testTopics.map(testTopic => {
      const questionIds = testTopic.questions.map(q => q.questionId);
      console.log('🎯 Topic:', testTopic.topicName, '- Questions:', questionIds.length);

      return {
        topicId: testTopic.topicId,
        topicName: testTopic.topicName,
        targetCount: testTopic.questions.length, // Set target to current count
        selectedQuestionIds: questionIds
      };
    });

    // Create and save plan
    const newPlan: TestPlan = {
      testId: test.id,
      subjectId: test.subjectId,
      topicPlans: topicPlans,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('💾 Saving new plan:', newPlan);
    this._testPlan.set(newPlan);
    this.savePlanToSessionStorage();

    console.log('✅ Plan created successfully, loading available questions');

    // Now load available questions
    this.loadAvailableQuestions();
  }

  /**
   * Create plan from existing test questions (if no plan exists) - OLD METHOD
   */
  createPlanFromExistingQuestions(questions: TestQuestionDto[]): void {
    console.log('🏗️ createPlanFromExistingQuestions called with', questions.length, 'questions');

    const existingPlan = this._testPlan();
    console.log('📋 Existing plan:', existingPlan);

    // Don't override if plan already exists
    if (existingPlan && existingPlan.topicPlans.length > 0) {
      console.log('⏭️ Plan already exists, skipping');
      return;
    }

    const test = this._test();
    const topics = this._topics();
    console.log('🔍 Data check - test:', !!test, ', topics count:', topics.length, ', questions:', questions.length);

    // Wait for all data to be loaded
    if (!test || topics.length === 0 || questions.length === 0) {
      console.log('⚠️ Missing data, cannot create plan. Test:', !!test, ', Topics:', topics.length, ', Questions:', questions.length);
      return;
    }

    console.log('✅ All data available, proceeding with plan creation');

    // Group questions by topicId
    const topicMap = new Map<string, { questions: TestQuestionDto[]; topicName: string }>();

    questions.forEach(tq => {
      console.log('📝 Processing question:', tq.questionId, ', topicId:', tq.topicId);
      console.log('📝 Full question object:', tq);

      // Use 'unknown' if topicId is missing
      const topicId = tq.topicId || 'unknown';

      if (!topicMap.has(topicId)) {
        // Try to get topic name from topics list
        const topic = topics.find(t => t.id === topicId);
        const topicName = topic?.name || (topicId === 'unknown' ? 'Вопросы без топика' : 'Unknown Topic');
        console.log('🏷️ Found topic for', topicId, ':', topicName);
        topicMap.set(topicId, {
          questions: [],
          topicName: topicName
        });
      }
      topicMap.get(topicId)!.questions.push(tq);
    });

    console.log('📊 Topic map size:', topicMap.size);

    // Skip if no topics found in questions
    if (topicMap.size === 0) {
      console.log('⚠️ No topics found in questions');
      return;
    }

    // Create topic plans
    const topicPlans: TopicPlan[] = [];
    topicMap.forEach((data, topicId) => {
      const questionIds = data.questions.map(q => q.questionId);
      console.log('🎯 Creating topic plan for', data.topicName, ':', questionIds.length, 'questions');
      topicPlans.push({
        topicId: topicId,
        topicName: data.topicName,
        targetCount: data.questions.length, // Set target to current count
        selectedQuestionIds: questionIds
      });
    });

    // Create and save plan
    const newPlan: TestPlan = {
      testId: test.id,
      subjectId: test.subjectId,
      topicPlans: topicPlans,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('💾 Saving new plan:', newPlan);
    this._testPlan.set(newPlan);
    this.savePlanToSessionStorage();

    console.log('✅ Plan created successfully, loading available questions');

    // Now load available questions
    this.loadAvailableQuestions();
  }

  /**
   * Clear plan from sessionStorage
   */
  clearPlanFromSessionStorage(testId: string): void {
    const key = `testPlan_${testId}`;
    sessionStorage.removeItem(key);
  }

  // ===================
  // PLAN VALIDATION & PROGRESS
  // ===================

  /**
   * Check if plan is fulfilled
   */
  isPlanFulfilled(): boolean {
    const progress = this.getPlanProgress();
    return progress.isFulfilled;
  }

  /**
   * Get plan progress
   */
  getPlanProgress(): PlanProgress {
    const plan = this._testPlan();

    if (!plan || plan.topicPlans.length === 0) {
      return {
        totalSelected: 0,
        totalTarget: 0,
        isFulfilled: true,
        percentage: 100,
        topicProgress: []
      };
    }

    const topicProgress: TopicProgress[] = plan.topicPlans.map(tp => {
      const selected = tp.selectedQuestionIds.length;
      const target = tp.targetCount;
      const isFulfilled = selected >= target;
      const percentage = target > 0 ? Math.round((selected / target) * 100) : 0;

      return {
        topicId: tp.topicId,
        topicName: tp.topicName,
        selected,
        target,
        isFulfilled,
        percentage
      };
    });

    const totalSelected = topicProgress.reduce((sum, tp) => sum + tp.selected, 0);
    const totalTarget = topicProgress.reduce((sum, tp) => sum + tp.target, 0);
    const isFulfilled = topicProgress.every(tp => tp.isFulfilled);
    const percentage = totalTarget > 0 ? Math.round((totalSelected / totalTarget) * 100) : 0;

    return {
      totalSelected,
      totalTarget,
      isFulfilled,
      percentage,
      topicProgress
    };
  }

  /**
   * Get progress for specific topic
   */
  getTopicProgress(topicId: string): TopicProgress {
    const progress = this.getPlanProgress();
    return progress.topicProgress.find(tp => tp.topicId === topicId) || {
      topicId,
      topicName: '',
      selected: 0,
      target: 0,
      isFulfilled: false,
      percentage: 0
    };
  }

  /**
   * Get target count for topic
   */
  getTopicTargetCount(topicId: string): number {
    const plan = this._testPlan();
    if (!plan) return 0;

    const topicPlan = plan.topicPlans.find(tp => tp.topicId === topicId);
    return topicPlan?.targetCount || 0;
  }

  /**
   * Check if topic is fulfilled
   */
  isTopicFulfilled(topicId: string): boolean {
    return this.getTopicProgress(topicId).isFulfilled;
  }

  /**
   * Toggle topic collapse state in Question Bank
   */
  toggleQuestionBankTopicCollapse(topicId: string): void {
    if (this.collapsedQuestionBankTopics.has(topicId)) {
      this.collapsedQuestionBankTopics.delete(topicId);
    } else {
      this.collapsedQuestionBankTopics.add(topicId);
    }
  }

  /**
   * Check if topic is collapsed in Question Bank
   */
  isQuestionBankTopicCollapsed(topicId: string): boolean {
    return this.collapsedQuestionBankTopics.has(topicId);
  }

  /**
   * Toggle topic collapse state in Test Basket
   */
  toggleTestTopicCollapse(topicId: string): void {
    if (this.collapsedTestTopics.has(topicId)) {
      this.collapsedTestTopics.delete(topicId);
    } else {
      this.collapsedTestTopics.add(topicId);
    }
  }

  /**
   * Check if topic is collapsed in Test Basket
   */
  isTestTopicCollapsed(topicId: string): boolean {
    return this.collapsedTestTopics.has(topicId);
  }

  /**
   * Handle drop within topic group
   */
  onDropWithinTopic(event: CdkDragDrop<TestQuestionDto[]>, topicId: string): void {
    if (this.isPublished()) {
      this.notify.warning('Cannot modify published test');
      return;
    }

    const group = this.groupedTestQuestions().find(g => g.topicId === topicId);
    if (!group) return;

    const questions = [...group.questions];
    moveItemInArray(questions, event.previousIndex, event.currentIndex);

    // Update order in main testQuestions array
    const allQuestions = [...this._testQuestions()];
    questions.forEach((q, index) => {
      const mainIndex = allQuestions.findIndex(tq => tq.questionId === q.questionId);
      if (mainIndex > -1) {
        allQuestions[mainIndex].order = index;
      }
    });

    allQuestions.sort((a, b) => a.order - b.order);

    this._testQuestions.set(allQuestions);
  }
}
