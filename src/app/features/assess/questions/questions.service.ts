import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagedResponse } from '../../../core/models/pagination';
import { TopicDto } from '../topics/topics.service';

/**
 * Question difficulty level
 */
export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

/**
 * Choice DTO for multiple-choice questions
 */
export interface ChoiceDto {
  id?: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

/**
 * Question DTO returned from API
 */
export interface QuestionDto {
  id: string;
  text: string;
  topicId: string;
  topic?: TopicDto;
  difficulty: QuestionDifficulty;
  choices: ChoiceDto[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Request body for creating a new question
 */
export interface CreateQuestionBody {
  text: string;
  topicId: string;
  difficulty: QuestionDifficulty;
  choices: ChoiceDto[];
}

/**
 * Request body for updating a question
 */
export interface UpdateQuestionBody {
  text?: string;
  topicId?: string;
  difficulty?: QuestionDifficulty;
  choices?: ChoiceDto[];
}

/**
 * Parameters for filtering questions list
 */
export interface QuestionListParams {
  topicId?: string;
  difficulty?: QuestionDifficulty;
  subjectId?: string;
  q?: string;
  page?: number;
  size?: number;
}

/**
 * Questions Service
 *
 * Handles question bank management operations:
 * - CRUD for questions
 * - Each question has multiple choices (one must be correct)
 * - Questions are organized by topics
 * - Difficulty levels: EASY, MEDIUM, HARD
 */
@Injectable({ providedIn: 'root' })
export class QuestionsService {
  private base = '/api/assess/questions';

  constructor(private http: HttpClient) {}

  /**
   * Get paginated list of questions with optional filters
   * @param params Filter parameters (topic, difficulty, subject, search, pagination)
   * @returns Observable of PagedResponse with QuestionDto
   */
  list(params: QuestionListParams = {}): Observable<PagedResponse<QuestionDto>> {
    let httpParams = new HttpParams();

    if (params.topicId) {
      httpParams = httpParams.set('topicId', params.topicId);
    }
    if (params.difficulty) {
      httpParams = httpParams.set('difficulty', params.difficulty);
    }
    if (params.subjectId) {
      httpParams = httpParams.set('subjectId', params.subjectId);
    }
    if (params.q) {
      httpParams = httpParams.set('q', params.q);
    }

    httpParams = httpParams
      .set('page', (params.page ?? 0).toString())
      .set('size', (params.size ?? 20).toString());

    return this.http.get<PagedResponse<QuestionDto>>(this.base, { params: httpParams });
  }

  /**
   * Get one question by ID
   * @param id Question UUID
   * @returns Observable of QuestionDto
   */
  getOne(id: string): Observable<QuestionDto> {
    return this.http.get<QuestionDto>(`${this.base}/${id}`);
  }

  /**
   * Create a new question
   * Requires at least one correct choice
   * @param body Question creation data
   * @returns Observable of created QuestionDto
   */
  create(body: CreateQuestionBody): Observable<QuestionDto> {
    return this.http.post<QuestionDto>(this.base, body);
  }

  /**
   * Update a question
   * @param id Question UUID
   * @param body Update data
   * @returns Observable of updated QuestionDto
   */
  update(id: string, body: UpdateQuestionBody): Observable<QuestionDto> {
    return this.http.put<QuestionDto>(`${this.base}/${id}`, body);
  }

  /**
   * Delete a question
   * @param id Question UUID
   * @returns Observable of void
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  /**
   * Validate that question has exactly one correct choice
   * @param choices Array of choices
   * @returns true if valid, false otherwise
   */
  validateChoices(choices: ChoiceDto[]): boolean {
    const correctCount = choices.filter(c => c.isCorrect).length;
    return correctCount === 1;
  }
}
