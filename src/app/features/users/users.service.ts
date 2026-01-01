import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClassDto } from '../classes';
import { PagedResponse } from '../../core/models/pagination';

/**
 * User DTO returned from API
 */
export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  isActive: boolean;
  isDeleted: boolean;
  dateOfBirth?: string; // ISO date string (YYYY-MM-DD)
  photoKey?: string;    // S3 key for avatar photo
  photoUrl?: string | null; // Presigned URL for avatar photo
  classDto?: ClassDto
}

/**
 * Request body for creating a new user
 */
export interface CreateUserBody {
  email: string;
  fullName: string;
  role: string;
  password: string;
  dateOfBirth?: string; // ISO date string (YYYY-MM-DD)
  photoKey?: string;    // S3 key for avatar photo (deprecated, use photoMediaId)
  photoMediaId?: string; // UUID of MediaObject for avatar photo
  classId?: string;     // Required only for STUDENT role
}

/**
 * Request body for updating a user
 * Only these fields can be updated
 */
export interface UpdateUserBody {
  fullName?: string;
  role?: string;
  status?: string;     // ACTIVE or INACTIVE
  dateOfBirth?: string; // ISO date string (YYYY-MM-DD)
  photoKey?: string;    // S3 key for avatar photo (deprecated, use photoMediaId)
  photoMediaId?: string; // UUID of MediaObject for avatar photo
  classId?: string;     // Required only for STUDENT role
}

/**
 * School class info in student card
 */
export interface SchoolClassInfo {
  id: string;
  code: string;
  classTeacherId: string;
  langType: string; // KAZ, RUS, ENG
}

/**
 * Attendance statistics for student card
 */
export interface AttendanceStats {
  totalLessons: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  attendanceRate: number;
}

/**
 * Student card DTO with attendance statistics
 */
export interface StudentCardDto {
  id: string;
  email: string;
  fullName: string;
  dateOfBirth: string; // ISO date string (YYYY-MM-DD)
  isActive: boolean;
  status: string;
  photoKey?: string; // S3 key for avatar photo
  photoUrl?: string | null; // Presigned URL for avatar photo
  schoolClass: SchoolClassInfo;
  attendanceStats: AttendanceStats;
}

/**
 * Subject taught by staff member
 */
export interface TaughtSubject {
  subjectId: string;
  subjectName: string;
  groups: string[]; // e.g. ["5A группа 1", "5B группа 1"]
}

/**
 * Staff card DTO with teaching information
 */
export interface StaffCardDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  status: string;
  photoKey?: string; // S3 key for avatar photo
  photoUrl?: string | null; // Presigned URL for avatar photo
  classAsTeacher?: SchoolClassInfo;
  taughtSubjects: TaughtSubject[];
}

/**
 * Users Service
 *
 * Automatically benefits from all interceptors:
 * - Loading: Shows spinner during requests
 * - Auth: Adds Bearer token automatically
 * - Error: Shows user-friendly error notifications
 */
@Injectable({ providedIn: 'root' })
export class UsersService {
  private base = '/api/users';

  constructor(private http: HttpClient) {}

  /**
   * Get list of all active users
   * @returns Observable of UserDto array
   */
  list(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(this.base);
  }

  /**
   * Get paginated list of all active users
   * @param page Page number (0-indexed)
   * @param size Page size
   * @returns Observable of PagedResponse with UserDto
   */
  listPaged(page: number = 0, size: number = 10): Observable<PagedResponse<UserDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PagedResponse<UserDto>>(this.base, { params });
  }

  /**
   * Get list of students
   * @returns Observable of UserDto array with class info
   */
  listStudents(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.base}/students`);
  }

  /**
   * Get paginated list of students
   * @param page Page number (0-indexed)
   * @param size Page size
   * @returns Observable of PagedResponse with UserDto
   */
  listStudentsPaged(page: number = 0, size: number = 10): Observable<PagedResponse<UserDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PagedResponse<UserDto>>(`${this.base}/students`, { params });
  }

  /**
   * Get list of staff (non-student users)
   * @returns Observable of UserDto array
   */
  listStaff(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.base}/staff`);
  }

  /**
   * Get paginated list of staff (non-student users)
   * @param page Page number (0-indexed)
   * @param size Page size
   * @returns Observable of PagedResponse with UserDto
   */
  listStaffPaged(page: number = 0, size: number = 10): Observable<PagedResponse<UserDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PagedResponse<UserDto>>(`${this.base}/staff`, { params });
  }

  /**
   * Get list of deleted users
   * Requires ADMIN or SUPER_ADMIN role
   * @returns Observable of UserDto array
   */
  listDeleted(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.base}/deleted`);
  }

  /**
   * Get paginated list of deleted users
   * Requires ADMIN or SUPER_ADMIN role
   * @param page Page number (0-indexed)
   * @param size Page size
   * @returns Observable of PagedResponse with UserDto
   */
  listDeletedPaged(page: number = 0, size: number = 10): Observable<PagedResponse<UserDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PagedResponse<UserDto>>(`${this.base}/deleted`, { params });
  }

  /**
   * Get one user by ID
   * @param id User UUID
   * @returns Observable of UserDto
   */
  getOne(id: string): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.base}/${id}`);
  }

  /**
   * Create a new user
   * Requires ADMIN or SUPER_ADMIN role
   * @param body User creation data
   * @returns Observable of created UserDto
   */
  create(body: CreateUserBody): Observable<UserDto> {
    return this.http.post<UserDto>(this.base, body);
  }

  /**
   * Update a user
   * Requires ADMIN or SUPER_ADMIN role
   * @param id User UUID
   * @param body Update data
   * @returns Observable of updated UserDto
   */
  update(id: string, body: UpdateUserBody): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.base}/${id}`, body);
  }

  /**
   * Activate a user
   * Requires ADMIN or SUPER_ADMIN role
   * @param id User UUID
   * @returns Observable of updated UserDto
   */
  activate(id: string): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.base}/${id}/activate`, {});
  }

  /**
   * Deactivate a user
   * Requires ADMIN or SUPER_ADMIN role
   * @param id User UUID
   * @returns Observable of updated UserDto
   */
  deactivate(id: string): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.base}/${id}/deactivate`, {});
  }

  /**
   * Soft delete a user (marks as deleted and inactive)
   * Requires ADMIN or SUPER_ADMIN role
   * @param id User UUID
   * @returns Observable of updated UserDto
   */
  delete(id: string): Observable<UserDto> {
    return this.http.delete<UserDto>(`${this.base}/${id}`);
  }

  /**
   * Get student card with attendance statistics
   * @param studentId Student UUID
   * @returns Observable of StudentCardDto
   */
  getStudentCard(studentId: string): Observable<StudentCardDto> {
    return this.http.get<StudentCardDto>(`${this.base}/student/${studentId}/card`);
  }

  /**
   * Get staff card with teaching information
   * @param staffId Staff UUID
   * @returns Observable of StaffCardDto
   */
  getStaffCard(staffId: string): Observable<StaffCardDto> {
    return this.http.get<StaffCardDto>(`${this.base}/staff/${staffId}/card`);
  }

  /**
   * Delete user photo
   * Requires ADMIN or SUPER_ADMIN role, or the user deleting their own photo
   * @param userId User UUID
   * @returns Observable of void
   */
  deletePhoto(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${userId}/photo`);
  }
}
