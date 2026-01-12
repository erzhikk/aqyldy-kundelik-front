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
 * Last Attempt Info
 */
export interface LastAttemptDto {
  attemptId: string;
  testId: string;
  testName: string;
  subjectName: string;
  completedAt: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
}

/**
 * Attempt Summary
 */
export interface AttemptSummaryDto {
  attemptId: string;
  testId: string;
  testName: string;
  subjectName?: string;
  subjectNameRu?: string;
  subjectNameKk?: string;
  subjectNameEn?: string;
  attemptDate: string;
  percent: number;
  correctAnswers: number;
  totalQuestions: number;
  wrongAnswers: number;
  strongTopics: string[];  // топики с высоким процентом
  weakTopics: string[];    // топики с низким процентом
}

/**
 * Topic Performance by Attempt
 */
export interface AttemptTopicDto {
  topicId: string;
  topicName: string;
  percent: number;
  correct: number;
  total: number;
  wrong: number;
}

/**
 * Question Result for Drill-Down
 */
export interface QuestionResultDto {
  questionId: string;
  questionText: string;
  isCorrect: boolean;
  selectedAnswerId?: string;
  selectedAnswerText?: string;
  correctAnswerId?: string;
  correctAnswerText?: string;
  explanation?: string;
}

/**
 * Topic Drill-Down Details
 */
export interface TopicDrillDownDto {
  topicId: string;
  topicName: string;
  percentage: number;
  questions: QuestionResultDto[];
}

// ============ Teacher/Admin Analytics DTOs ============

/**
 * Class Analytics Item
 */
export interface ClassAnalyticsDto {
  classId: string;
  className: string;
  lastTestName?: string;
  avgPercentage?: number;
}

/**
 * Class Last Test Summary
 */
export interface ClassTestSummaryDto {
  classId: string;
  className: string;
  testId: string;
  testName: string;
  avgPercent: number;
  medianPercent: number;
  problematicTopics: string[];
  riskStudentsCount: number;
}

/**
 * Class Topic Performance
 */
export interface ClassTopicDto {
  topicId: string;
  topicName: string;
  avgPercent: number;
  medianPercent: number;
}

/**
 * Class Topic Drill-Down
 */
export interface ClassTopicDrillDownDto {
  topicId: string;
  topicName: string;
  avgPercent: number;
  topWorstQuestions: {
    questionId: string;
    questionText: string;
    incorrectCount: number;
    totalAttempts: number;
  }[];
  riskStudents?: {
    studentId: string;
    studentName: string;
    percentage: number;
  }[];
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

  // ============ Student Analytics Endpoints ============

  /**
   * Get student's last graded attempt
   * GET /api/student/analytics/last-attempt
   */
  getStudentLastAttempt(): Observable<LastAttemptDto | null> {
    return this.http.get<LastAttemptDto | null>(`${environment.apiUrl}/student/analytics/last-attempt`);
  }

  /**
   * Get attempt summary
   * GET /api/student/analytics/attempts/{attemptId}/summary
   */
  getAttemptSummary(attemptId: string): Observable<AttemptSummaryDto> {
    return this.http.get<AttemptSummaryDto>(
      `${environment.apiUrl}/student/analytics/attempts/${attemptId}/summary`
    );
  }

  /**
   * Get summaries for student's graded attempts
   * GET /api/student/analytics/attempts/summary
   */
  getStudentAttemptsSummary(): Observable<AttemptSummaryDto[]> {
    return this.http.get<AttemptSummaryDto[]>(
      `${environment.apiUrl}/student/analytics/attempts/summary`
    );
  }

  /**
   * Get topics performance for specific attempt
   * GET /api/student/analytics/attempts/{attemptId}/topics
   */
  getAttemptTopics(attemptId: string): Observable<AttemptTopicDto[]> {
    return this.http.get<AttemptTopicDto[]>(
      `${environment.apiUrl}/student/analytics/attempts/${attemptId}/topics`
    );
  }

  /**
   * Get topic drill-down for specific attempt
   * GET /api/student/analytics/attempts/{attemptId}/topics/{topicId}
   */
  getTopicDrillDown(attemptId: string, topicId: string): Observable<TopicDrillDownDto> {
    return this.http.get<TopicDrillDownDto>(
      `${environment.apiUrl}/student/analytics/attempts/${attemptId}/topics/${topicId}`
    );
  }

  // ============ Teacher/Admin Analytics Endpoints ============

  /**
   * Get list of classes with analytics
   * GET /api/teacher/analytics/classes
   */
  getTeacherClasses(): Observable<ClassAnalyticsDto[]> {
    return this.http.get<ClassAnalyticsDto[]>(`${environment.apiUrl}/teacher/analytics/classes`);
  }

  /**
   * Get class last test summary
   * GET /api/teacher/analytics/classes/{classId}/last-test/summary
   */
  getClassLastTestSummary(classId: string): Observable<ClassTestSummaryDto> {
    return this.http.get<ClassTestSummaryDto>(
      `${environment.apiUrl}/teacher/analytics/classes/${classId}/last-test/summary`
    );
  }

  /**
   * Get class topics performance for specific test
   * GET /api/teacher/analytics/classes/{classId}/tests/{testId}/topics
   */
  getClassTestTopics(classId: string, testId: string): Observable<ClassTopicDto[]> {
    return this.http.get<ClassTopicDto[]>(
      `${environment.apiUrl}/teacher/analytics/classes/${classId}/tests/${testId}/topics`
    );
  }

  /**
   * Get class topic drill-down
   * GET /api/teacher/analytics/classes/{classId}/tests/{testId}/topics/{topicId}
   */
  getClassTopicDrillDown(classId: string, testId: string, topicId: string): Observable<ClassTopicDrillDownDto> {
    return this.http.get<ClassTopicDrillDownDto>(
      `${environment.apiUrl}/teacher/analytics/classes/${classId}/tests/${testId}/topics/${topicId}`
    );
  }
}
