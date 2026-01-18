import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Class level for curriculum
 */
export interface CurriculumLevel {
  id: string;
  level: number;
  nameRu: string;
  nameKk: string;
  maxLessonsPerDay: number;
  daysPerWeek: number;
}

/**
 * Subject item with hours per week in curriculum
 */
export interface CurriculumSubjectItem {
  subjectId: string;
  nameRu: string;
  nameKk: string;
  nameEn: string;
  hoursPerWeek: number;
}

/**
 * Response for curriculum subjects by class level
 */
export interface CurriculumSubjectsResponse {
  classLevelId: string;
  maxLessonsPerDay: number;
  maxHoursPerWeek: number;
  totalHoursPerWeek: number;
  daysPerWeek?: number;
  subjects: CurriculumSubjectItem[];
  warnings: string[];
}

/**
 * Request body for updating curriculum hours
 */
export interface CurriculumUpdateRequest {
  items: { subjectId: string; hoursPerWeek: number }[];
  daysPerWeek?: number;
}

/**
 * Request body for updating level settings
 */
export interface LevelSettingsRequest {
  maxLessonsPerDay: number;
}

/**
 * Curriculum Service
 *
 * Manages curriculum (hours per week by class level)
 * Uses admin endpoints for curriculum management
 */
@Injectable({ providedIn: 'root' })
export class CurriculumService {
  private base = '/api/admin/curriculum';

  constructor(private http: HttpClient) {}

  /**
   * Get all class levels for curriculum editing
   * @returns Observable of CurriculumLevel array
   */
  getLevels(): Observable<CurriculumLevel[]> {
    return this.http.get<CurriculumLevel[]>(`${this.base}/levels`);
  }

  /**
   * Get subjects with hours per week for a class level
   * @param classLevelId Class level UUID
   * @returns Observable of CurriculumSubjectsResponse
   */
  getSubjects(classLevelId: string): Observable<CurriculumSubjectsResponse> {
    return this.http.get<CurriculumSubjectsResponse>(`${this.base}/levels/${classLevelId}/subjects`);
  }

  /**
   * Update hours per week for subjects in a class level
   * @param classLevelId Class level UUID
   * @param request Update request with subject hours
   * @returns Observable of CurriculumSubjectsResponse
   */
  updateSubjects(classLevelId: string, request: CurriculumUpdateRequest): Observable<CurriculumSubjectsResponse> {
    return this.http.put<CurriculumSubjectsResponse>(`${this.base}/levels/${classLevelId}/subjects`, request);
  }

  /**
   * Update level settings (maxLessonsPerDay)
   * @param classLevelId Class level UUID
   * @param request Settings request
   * @returns Observable of CurriculumLevel
   */
  updateLevelSettings(classLevelId: string, request: LevelSettingsRequest): Observable<CurriculumLevel> {
    return this.http.put<CurriculumLevel>(`${this.base}/levels/${classLevelId}/settings`, request);
  }
}
