import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagedResponse } from '../../../core/models/pagination';
import { SubjectDto } from '../../subjects/subjects.service';

/**
 * Test Topic with questions (from backend)
 */
export interface TestTopicDto {
  topicId: string;
  topicName: string;
  topicDescription?: string;
  questions: TestQuestionDto[];
}

/**
 * Test DTO returned from API
 */
export interface TestDto {
  id: string;
  name?: string;
  title?: string;
  description: string | null;
  subjectId: string;
  subjectNameRu?: string;
  subjectNameKk?: string;
  subjectNameEn?: string;
  subject?: SubjectDto;
  classLevel?: number;
  grade?: number;
  published?: boolean;
  status?: string;
  hasAttempts?: boolean;
  maxScore?: number;
  durationSec?: number;
  allowedAttempts?: number;
  passingPercent?: number;
  reviewPolicy?: ReviewPolicy;
  shuffleQuestions?: boolean;
  shuffleChoices?: boolean;
  opensAt?: string | null;
  closesAt?: string | null;
  schoolClasses?: {
    id: string;
    code: string;
    classLevel: number;
  }[];
  topics?: TestTopicDto[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Test Question (link between test and question)
 */
export interface TestQuestionDto {
  id: string;
  questionId: string;
  questionText?: string; // Used when creating questions locally
  text?: string; // Received from backend
  order: number;
  weight: number;
  // Full question data from backend (when included)
  choices?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    order: number;
  }>;
  difficulty?: string;
  explanation?: string;
  topicId?: string;
}

/**
 * Request body for adding questions to test
 */
export interface AddQuestionsToTestBody {
  questions: {
    questionId: string;
    order: number;
    weight: number;
  }[];
}

/**
 * Request body for reordering test questions
 */
export interface ReorderTestQuestionsBody {
  questions: {
    id: string;
    order: number;
  }[];
}

/**
 * Review Policy for test results
 */
export type ReviewPolicy = 'AFTER_SUBMIT' | 'AFTER_CLOSE' | 'NEVER';

/**
 * Request body for creating a new test
 */
export interface CreateTestBody {
  name: string;
  description?: string | null;
  subjectId: string;
  schoolClassIds: string[];
  durationSec: number;
  allowedAttempts: number;
  opensAt?: string | null;
  closesAt?: string | null;
  shuffleQuestions: boolean;
  shuffleChoices: boolean;
  passingPercent: number;
  reviewPolicy: ReviewPolicy;
}

/**
 * Request body for updating a test
 */
export interface UpdateTestBody {
  name?: string;
  description?: string | null;
  subjectId?: string;
  schoolClassIds?: string[];
  durationSec?: number;
  allowedAttempts?: number;
  opensAt?: string | null;
  closesAt?: string | null;
  shuffleQuestions?: boolean;
  shuffleChoices?: boolean;
  passingPercent?: number;
  reviewPolicy?: ReviewPolicy;
}

/**
 * Parameters for filtering tests list
 */
export interface TestListParams {
  subjectId?: string;
  grade?: number;
  published?: boolean;
  q?: string;
  page?: number;
  size?: number;
}

/**
 * Plan for a topic within a test (frontend only)
 */
export interface TopicPlan {
  topicId: string;
  topicName: string;
  targetCount: number;           // How many questions are needed
  selectedQuestionIds: string[]; // Which questions are already selected
}

/**
 * Test composition plan (stored in sessionStorage only, not on backend)
 */
export interface TestPlan {
  testId: string;
  subjectId: string;
  topicPlans: TopicPlan[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Progress summary for a topic
 */
export interface TopicProgress {
  topicId: string;
  topicName: string;
  selected: number;
  target: number;
  isFulfilled: boolean;
  percentage: number;
}

/**
 * Overall plan progress
 */
export interface PlanProgress {
  totalSelected: number;
  totalTarget: number;
  isFulfilled: boolean;
  percentage: number;
  topicProgress: TopicProgress[];
}

/**
 * Tests Service
 *
 * Handles test management operations:
 * - List tests with filters (subject, grade, published, search)
 * - Create, update, delete tests
 * - Publish tests (locks composition editing)
 *
 * Automatically benefits from all interceptors:
 * - Loading: Shows spinner during requests
 * - Auth: Adds Bearer token automatically
 * - Error: Shows user-friendly error notifications (including 409 for delete with attempts)
 */
@Injectable({ providedIn: 'root' })
export class TestsService {
  private base = '/api/assess/tests';

  constructor(private http: HttpClient) {}

  /**
   * Get paginated list of tests with optional filters
   * @param params Filter parameters (subject, grade, published, search, pagination)
   * @returns Observable of PagedResponse with TestDto
   */
  list(params: TestListParams = {}): Observable<PagedResponse<TestDto>> {
    let httpParams = new HttpParams();

    if (params.subjectId) {
      httpParams = httpParams.set('subjectId', params.subjectId);
    }
    if (params.grade !== undefined && params.grade !== null) {
      httpParams = httpParams.set('grade', params.grade.toString());
    }
    if (params.published !== undefined && params.published !== null) {
      httpParams = httpParams.set('published', params.published.toString());
    }
    if (params.q) {
      httpParams = httpParams.set('q', params.q);
    }

    httpParams = httpParams
      .set('page', (params.page ?? 0).toString())
      .set('size', (params.size ?? 10).toString());

    return this.http.get<PagedResponse<TestDto>>(this.base, { params: httpParams });
  }

  /**
   * Get one test by ID
   * @param id Test UUID
   * @returns Observable of TestDto
   */
  getOne(id: string): Observable<TestDto> {
    return this.http.get<TestDto>(`${this.base}/${id}`);
  }

  /**
   * Create a new test
   * @param body Test creation data
   * @returns Observable of created TestDto
   */
  create(body: CreateTestBody): Observable<TestDto> {
    return this.http.post<TestDto>(this.base, body);
  }

  /**
   * Update a test
   * Note: Cannot update composition of published tests
   * @param id Test UUID
   * @param body Update data
   * @returns Observable of updated TestDto
   */
  update(id: string, body: UpdateTestBody): Observable<TestDto> {
    return this.http.put<TestDto>(`${this.base}/${id}`, body);
  }

  /**
   * Delete a test
   * Returns 409 Conflict if test has attempts
   * @param id Test UUID
   * @returns Observable of void
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  /**
   * Publish a test
   * After publishing, test composition cannot be edited
   * @param id Test UUID
   * @returns Observable of updated TestDto
   */
  publish(id: string): Observable<TestDto> {
    return this.http.post<TestDto>(`${this.base}/${id}/publish`, {});
  }

  /**
   * Get test questions (composition)
   * @param testId Test UUID
   * @returns Observable of TestQuestionDto array
   */
  getTestQuestions(testId: string): Observable<TestQuestionDto[]> {
    return this.http.get<TestQuestionDto[]>(`${this.base}/${testId}/questions`);
  }

  /**
   * Add questions to test
   * Cannot add questions to published test
   * @param testId Test UUID
   * @param body Questions to add with order and weight
   * @returns Observable of TestQuestionDto array
   */
  addQuestionsToTest(testId: string, body: AddQuestionsToTestBody): Observable<TestQuestionDto[]> {
    return this.http.post<TestQuestionDto[]>(`${this.base}/${testId}/questions`, body);
  }

  /**
   * Reorder test questions
   * @param testId Test UUID
   * @param body New order for questions
   * @returns Observable of TestQuestionDto array
   */
  reorderTestQuestions(testId: string, body: ReorderTestQuestionsBody): Observable<TestQuestionDto[]> {
    return this.http.put<TestQuestionDto[]>(`${this.base}/${testId}/questions/reorder`, body);
  }

  /**
   * Remove question from test
   * @param testId Test UUID
   * @param questionId Test Question ID (not question ID!)
   * @returns Observable of void
   */
  removeQuestionFromTest(testId: string, questionId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${testId}/questions/${questionId}`);
  }
}
