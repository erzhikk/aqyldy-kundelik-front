import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Topic DTO returned from API
 */
export interface TopicDto {
  id: string;
  name: string;
  subjectId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request body for creating a new topic
 */
export interface CreateTopicBody {
  name: string;
  subjectId: string;
}

/**
 * Parameters for filtering topics list
 */
export interface TopicListParams {
  subjectId?: string;
  q?: string;
}

/**
 * Topics Service
 *
 * Handles topic (theme/unit) management operations.
 * Topics are used to organize questions within a subject.
 */
@Injectable({ providedIn: 'root' })
export class TopicsService {
  private base = '/api/assess/topics';

  constructor(private http: HttpClient) {}

  /**
   * Get list of topics with optional filters
   * @param params Filter parameters (subject, search)
   * @returns Observable of TopicDto array
   */
  list(params: TopicListParams = {}): Observable<TopicDto[]> {
    let httpParams = new HttpParams();

    if (params.subjectId) {
      httpParams = httpParams.set('subjectId', params.subjectId);
    }
    if (params.q) {
      httpParams = httpParams.set('q', params.q);
    }

    return this.http.get<TopicDto[]>(this.base, { params: httpParams });
  }

  /**
   * Create a new topic
   * @param body Topic creation data
   * @returns Observable of created TopicDto
   */
  create(body: CreateTopicBody): Observable<TopicDto> {
    return this.http.post<TopicDto>(this.base, body);
  }
}
