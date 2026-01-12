import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagedResponse } from '../../core/models/pagination';
import { UserDto } from '../users/users.service';

/**
 * Class DTO returned from API
 */
export interface ClassDto {
  id: string;
  code: string;
  classTeacherId?: string | null;
  classTeacherFullName?: string | null;
  teacher?: {
    id: string;
    fullName: string;
  };
  classTeacher?: {
    id: string;
    fullName: string;
  };
  classInfo?: {
    code: string;
    langType: string;
    classLevel?: number;
  };
  langType: string;
  classLevel?: number;
  classLevelId?: string;
  students?: UserDto[];
}

/**
 * Request body for creating a new class
 */
export interface CreateClassBody {
  code: string;
  classTeacherId?: string | null;
  langType: string;
  classLevel: number;
}

/**
 * Request body for updating a class
 */
export interface UpdateClassBody {
  code?: string;
  classTeacherId?: string | null;
  langType?: string;
  classLevelId?: string;
}

/**
 * Classes Service
 *
 * Automatically benefits from all interceptors:
 * - Loading: Shows spinner during requests
 * - Auth: Adds Bearer token automatically
 * - Error: Shows user-friendly error notifications
 */
@Injectable({ providedIn: 'root' })
export class ClassesService {
  private base = '/api/classes';

  constructor(private http: HttpClient) {}

  /**
   * Get list of all classes (without pagination)
   * @returns Observable of ClassDto array
   */
  list(): Observable<ClassDto[]> {
    return this.http.get<ClassDto[]>(this.base);
  }

  /**
   * Get all classes without pagination
   * Use this for dropdowns and selects
   * @returns Observable of ClassDto array
   */
  listAll(): Observable<ClassDto[]> {
    return this.http.get<ClassDto[]>(`${this.base}/all`);
  }

  /**
   * Get classes by class level ID (for dropdowns/selects)
   * @param classLevelId Class level UUID
   * @returns Observable of ClassDto array filtered by class level
   */
  getByClassLevel(classLevelId: string): Observable<ClassDto[]> {
    return this.http.get<ClassDto[]>(`${this.base}/by-class-level/${classLevelId}`);
  }

  /**
   * Get paginated list of all classes
   * @param page Page number (0-indexed)
   * @param size Page size
   * @returns Observable of PagedResponse with ClassDto
   */
  listPaged(page: number = 0, size: number = 10): Observable<PagedResponse<ClassDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PagedResponse<ClassDto>>(this.base, { params });
  }

  /**
   * Get one class by ID
   * @param id Class UUID
   * @returns Observable of ClassDto
   */
  getOne(id: string): Observable<ClassDto> {
    return this.http.get<ClassDto>(`${this.base}/${id}`);
  }

  /**
   * Get students for a class
   * @param classId Class UUID
   * @returns Observable of UserDto array
   */
  getStudents(classId: string): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.base}/${classId}/students`);
  }

  /**
   * Create a new class
   * Requires ADMIN or SUPER_ADMIN role
   * @param body Class creation data
   * @returns Observable of created ClassDto
   */
  create(body: CreateClassBody): Observable<ClassDto> {
    return this.http.post<ClassDto>(this.base, body);
  }

  /**
   * Update a class
   * Requires ADMIN or SUPER_ADMIN role
   * @param id Class UUID
   * @param body Update data
   * @returns Observable of updated ClassDto
   */
  update(id: string, body: UpdateClassBody): Observable<ClassDto> {
    return this.http.put<ClassDto>(`${this.base}/${id}`, body);
  }

  /**
   * Delete a class
   * Requires ADMIN or SUPER_ADMIN role
   * @param id Class UUID
   * @returns Observable of void
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
