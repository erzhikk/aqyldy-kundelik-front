import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Lesson summary for day view
 */
export interface DayLessonSummary {
  lessonNumber: number;
  subjectId: string;
  subjectNameRu: string;
  subjectNameKk?: string;
  teacherId?: string;
  teacherFullName?: string;
  hasAttendance: boolean;
}

/**
 * Response for day lessons
 */
export interface DayLessonsResponse {
  classId: string;
  classCode: string;
  date: string;
  lessons: DayLessonSummary[];
}

/**
 * Student attendance item
 */
export interface StudentAttendanceItem {
  studentId: string;
  fullName: string;
  present: boolean;
}

/**
 * Who marked the attendance
 */
export interface MarkedInfo {
  markedBy: string;
  markedByFullName: string;
  markedAt: string;
}

/**
 * Lesson attendance response
 */
export interface LessonAttendanceResponse {
  lessonInstanceId: string;
  classId: string;
  classCode: string;
  date: string;
  lessonNumber: number;
  subjectId: string;
  subjectNameRu: string;
  subjectNameKk?: string;
  teacherId?: string;
  teacherFullName?: string;
  students: StudentAttendanceItem[];
  markedInfo?: MarkedInfo;
}

/**
 * Request body for saving attendance
 */
export interface SaveAttendanceRequest {
  items: { studentId: string; present: boolean }[];
}

/**
 * Attendance Service
 *
 * Manages attendance marking for teachers
 */
@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private base = '/api/teacher/attendance';

  constructor(private http: HttpClient) {}

  /**
   * Get lessons for a class on a specific date
   * @param classId Class UUID
   * @param date Date in YYYY-MM-DD format
   * @returns Observable of DayLessonsResponse
   */
  getDayLessons(classId: string, date: string): Observable<DayLessonsResponse> {
    const params = new HttpParams().set('date', date);
    return this.http.get<DayLessonsResponse>(`${this.base}/classes/${classId}/day`, { params });
  }

  /**
   * Get attendance for a specific lesson
   * @param classId Class UUID
   * @param date Date in YYYY-MM-DD format
   * @param lessonNumber Lesson number (1-based)
   * @returns Observable of LessonAttendanceResponse
   */
  getLessonAttendance(classId: string, date: string, lessonNumber: number): Observable<LessonAttendanceResponse> {
    const params = new HttpParams()
      .set('date', date)
      .set('lessonNumber', lessonNumber.toString());
    return this.http.get<LessonAttendanceResponse>(`${this.base}/classes/${classId}/lesson`, { params });
  }

  /**
   * Save attendance for a lesson
   * @param lessonInstanceId Lesson instance UUID
   * @param request Attendance data
   * @returns Observable of LessonAttendanceResponse
   */
  saveLessonAttendance(lessonInstanceId: string, request: SaveAttendanceRequest): Observable<LessonAttendanceResponse> {
    return this.http.put<LessonAttendanceResponse>(`${this.base}/lessons/${lessonInstanceId}`, request);
  }
}
