import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Single cell in schedule grid
 */
export interface ScheduleCell {
  dayOfWeek: number;     // 1..daysPerWeek
  lessonNumber: number;  // 1..lessonsPerDay
  subjectId: string | null;
  subjectNameRu?: string;
  teacherId?: string | null;
  teacherFullName?: string;
}

/**
 * Conflict type in schedule
 */
export type ConflictType = 'TEACHER_BUSY' | 'MAX_LESSONS_EXCEEDED' | 'HOURS_MISMATCH';

/**
 * Schedule conflict info
 */
export interface ScheduleConflict {
  type: ConflictType;
  message: string;
  teacherId?: string;
  dayOfWeek?: number;
  lessonNumber?: number;
  subjectId?: string;
}

/**
 * Schedule status
 */
export type ScheduleStatus = 'DRAFT' | 'ACTIVE';

/**
 * Response for class schedule
 */
export interface ClassScheduleResponse {
  scheduleId: string;
  classId: string;
  status: ScheduleStatus;
  daysPerWeek: number;
  lessonsPerDay: number;
  grid: ScheduleCell[];
  conflicts: ScheduleConflict[];
}

/**
 * Request body for saving schedule
 */
export interface SaveScheduleRequest {
  daysPerWeek: number;
  lessonsPerDay: number;
  grid: { dayOfWeek: number; lessonNumber: number; subjectId: string | null }[];
}

/**
 * Schedule Service
 *
 * Manages class schedules (timetables)
 */
@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private base = '/api/admin/schedule';

  constructor(private http: HttpClient) {}

  /**
   * Get schedule for a class (backend creates draft if not exists)
   * @param classId Class UUID
   * @returns Observable of ClassScheduleResponse
   */
  getClassSchedule(classId: string): Observable<ClassScheduleResponse> {
    return this.http.get<ClassScheduleResponse>(`${this.base}/classes/${classId}`);
  }

  /**
   * Save schedule for a class
   * @param classId Class UUID
   * @param request Schedule data with grid
   * @returns Observable of ClassScheduleResponse with updated conflicts
   */
  saveClassSchedule(classId: string, request: SaveScheduleRequest): Observable<ClassScheduleResponse> {
    return this.http.put<ClassScheduleResponse>(`${this.base}/classes/${classId}`, request);
  }

  /**
   * Activate schedule for a class
   * @param classId Class UUID
   * @returns Observable of ClassScheduleResponse
   */
  activateSchedule(classId: string): Observable<ClassScheduleResponse> {
    return this.http.post<ClassScheduleResponse>(`${this.base}/classes/${classId}/activate`, {});
  }
}
