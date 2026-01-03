import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Choice in attempt question
 */
export interface AttemptChoiceDto {
  id: string;
  text: string;
  order: number;
}

/**
 * Question in attempt
 */
export interface AttemptQuestionDto {
  id: string;
  order: number;
  text: string;
  choices: AttemptChoiceDto[];
  weight: number;
}

/**
 * Test attempt DTO returned when starting attempt
 */
export interface TestAttemptDto {
  attemptId: string;
  testId: string;
  testTitle: string;
  durationSec: number;
  questions: AttemptQuestionDto[];
  startedAt: string;
}

/**
 * Answer to save
 */
export interface AttemptAnswerDto {
  questionId: string;
  choiceId: string;
}

/**
 * Request body for saving answers
 */
export interface SaveAnswersBody {
  answers: AttemptAnswerDto[];
}

/**
 * Answer in result
 */
export interface ResultAnswerDto {
  questionId: string;
  questionText: string;
  choiceId: string;
  choiceText: string;
  isCorrect: boolean;
  correctChoiceId?: string;
  correctChoiceText?: string;
  weight: number;
}

/**
 * Test attempt result
 */
export interface AttemptResultDto {
  attemptId: string;
  testTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  submittedAt: string;
  reviewAllowed: boolean;
  answers?: ResultAnswerDto[];
}

/**
 * Attempts Service
 *
 * Handles test attempt operations:
 * - Start test attempt (creates attemptId, loads questions)
 * - Save answers (autosave during test taking)
 * - Submit attempt (finalize and get result)
 * - Get result (with optional answer review)
 */
@Injectable({ providedIn: 'root' })
export class AttemptsService {
  private base = '/api/assess';

  constructor(private http: HttpClient) {}

  /**
   * Start a test attempt
   * Creates new attempt and returns questions with timer
   * @param testId Test UUID
   * @returns Observable of TestAttemptDto
   */
  startAttempt(testId: string): Observable<TestAttemptDto> {
    return this.http.post<TestAttemptDto>(`${this.base}/tests/${testId}/attempts`, {});
  }

  /**
   * Save answers (autosave during test)
   * @param attemptId Attempt UUID
   * @param body Answers to save
   * @returns Observable of void
   */
  saveAnswers(attemptId: string, body: SaveAnswersBody): Observable<void> {
    return this.http.post<void>(`${this.base}/attempts/${attemptId}/answers`, body);
  }

  /**
   * Submit test attempt
   * Finalizes attempt and calculates score
   * @param attemptId Attempt UUID
   * @returns Observable of AttemptResultDto
   */
  submitAttempt(attemptId: string): Observable<AttemptResultDto> {
    return this.http.post<AttemptResultDto>(`${this.base}/attempts/${attemptId}/submit`, {});
  }

  /**
   * Get attempt result
   * @param attemptId Attempt UUID
   * @returns Observable of AttemptResultDto
   */
  getResult(attemptId: string): Observable<AttemptResultDto> {
    return this.http.get<AttemptResultDto>(`${this.base}/attempts/${attemptId}/result`);
  }
}
