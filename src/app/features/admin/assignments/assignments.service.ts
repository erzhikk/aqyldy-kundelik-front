import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Short teacher info for autocomplete
 */
export interface TeacherShort {
  id: string;
  fullName: string;
  email: string;
}

/**
 * Assignment item (subject-teacher pair)
 */
export interface ClassAssignmentItem {
  subjectId: string;
  subjectNameRu: string;
  teacherId: string | null;
  teacherFullName?: string;
  teacherEmail?: string;
}

/**
 * Response for class assignments
 */
export interface ClassAssignmentsResponse {
  classId: string;
  classCode: string;
  items: ClassAssignmentItem[];
}

/**
 * Request body for updating class assignments
 */
export interface ClassAssignmentsUpdateRequest {
  items: { subjectId: string; teacherId: string | null }[];
}

/**
 * Assignments Service
 *
 * Manages teacher assignments to subjects for classes
 */
@Injectable({ providedIn: 'root' })
export class AssignmentsService {
  private base = '/api/admin/assignments';

  constructor(private http: HttpClient) {}

  /**
   * Get teacher assignments for a class
   * @param classId Class UUID
   * @returns Observable of ClassAssignmentsResponse
   */
  getClassAssignments(classId: string): Observable<ClassAssignmentsResponse> {
    return this.http.get<ClassAssignmentsResponse>(`${this.base}/classes/${classId}`);
  }

  /**
   * Update teacher assignments for a class
   * @param classId Class UUID
   * @param request Update request with subject-teacher pairs
   * @returns Observable of ClassAssignmentsResponse
   */
  updateClassAssignments(classId: string, request: ClassAssignmentsUpdateRequest): Observable<ClassAssignmentsResponse> {
    return this.http.put<ClassAssignmentsResponse>(`${this.base}/classes/${classId}`, request);
  }

  /**
   * Search teachers by query (for autocomplete)
   * @param query Search query (name or email)
   * @returns Observable of TeacherShort array
   */
  searchTeachers(query: string): Observable<TeacherShort[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<TeacherShort[]>(`${this.base}/teachers`, { params });
  }
}
