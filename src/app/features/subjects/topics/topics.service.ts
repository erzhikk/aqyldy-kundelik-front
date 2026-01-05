import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Topic DTO returned from API
 */
export interface TopicDto {
  id: string;
  subjectId: string;
  name: string;
  description?: string | null;
  createdByFullName?: string | null;
  createdAt?: string | null;
  questionsCount?: number | null;
}

/**
 * Request body for creating a new topic
 */
export interface CreateTopicBody {
  subjectId: string;
  name: string;
  description?: string | null;
}

/**
 * Request body for updating a topic
 */
export interface UpdateTopicBody {
  name: string;
  description?: string | null;
}

/**
 * Topics Service
 *
 * Automatically benefits from all interceptors:
 * - Loading: Shows spinner during requests
 * - Auth: Adds Bearer token automatically
 * - Error: Shows user-friendly error notifications
 */
@Injectable({ providedIn: 'root' })
export class TopicsService {
  private base = '/api/assess/topics';

  constructor(private http: HttpClient) {}

  /**
   * Get topics for a specific subject
   * @param subjectId Subject UUID
   * @param q Optional search query
   * @returns Observable of TopicDto array
   */
  getTopics(subjectId: string, q?: string): Observable<TopicDto[]> {
    let params = new HttpParams().set('subjectId', subjectId);
    if (q && q.trim()) {
      params = params.set('q', q.trim());
    }
    return this.http.get<TopicDto[]>(this.base, { params });
  }

  /**
   * Get topic details by ID
   * @param id Topic UUID
   * @returns Observable of TopicDto
   */
  getTopic(id: string): Observable<TopicDto> {
    return this.http.get<TopicDto>(`${this.base}/${id}`);
  }

  /**
   * Create a new topic
   * @param body Topic creation data
   * @returns Observable of created TopicDto
   */
  createTopic(body: CreateTopicBody): Observable<TopicDto> {
    return this.http.post<TopicDto>(this.base, body);
  }

  /**
   * Update a topic
   * @param id Topic UUID
   * @param body Update data
   * @returns Observable of updated TopicDto
   */
  updateTopic(id: string, body: UpdateTopicBody): Observable<TopicDto> {
    return this.http.put<TopicDto>(`${this.base}/${id}`, body);
  }

  /**
   * Delete a topic
   * @param id Topic UUID
   * @returns Observable of void
   */
  deleteTopic(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
