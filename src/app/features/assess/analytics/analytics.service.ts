import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

/**
 * Topic Performance DTO
 */
export interface TopicPerformanceDto {
  topicId: string;
  topicName: string;
  percentage: number;
  correctCount: number;
  totalCount: number;
}

/**
 * Student Topic Performance Params
 */
export interface StudentTopicPerformanceParams {
  subjectId?: string;
  from?: string; // ISO date
  to?: string;   // ISO date
}

/**
 * Analytics Service
 *
 * Provides assessment analytics and reports
 */
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/assess/analytics`;

  /**
   * Get student topic performance
   * GET /api/assess/analytics/student/{studentId}/topics
   */
  getStudentTopicPerformance(
    studentId: string,
    params?: StudentTopicPerformanceParams
  ): Observable<TopicPerformanceDto[]> {
    let httpParams = new HttpParams();

    if (params?.subjectId) {
      httpParams = httpParams.set('subjectId', params.subjectId);
    }
    if (params?.from) {
      httpParams = httpParams.set('from', params.from);
    }
    if (params?.to) {
      httpParams = httpParams.set('to', params.to);
    }

    return this.http.get<TopicPerformanceDto[]>(
      `${this.apiUrl}/student/${studentId}/topics`,
      { params: httpParams }
    );
  }
}
