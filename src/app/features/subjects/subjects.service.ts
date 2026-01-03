import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagedResponse } from '../../core/models/pagination';

/**
 * Class Level DTO returned from API
 */
export interface ClassLevelDto {
  id: string;
  level: number;
  nameRu: string;
  nameKk: string;
}

/**
 * Subject DTO returned from API
 */
export interface SubjectDto {
  id: string;
  nameRu: string;
  nameKk: string;
  nameEn: string;
  classLevel: ClassLevelDto;
}

/**
 * Request body for creating a new subject
 */
export interface CreateSubjectBody {
  nameRu: string;
  nameKk: string;
  nameEn: string;
  classLevelId: string;
}

/**
 * Request body for updating a subject
 */
export interface UpdateSubjectBody {
  nameRu?: string;
  nameKk?: string;
  nameEn?: string;
  classLevelId?: string;
}

/**
 * Subjects Service
 *
 * Automatically benefits from all interceptors:
 * - Loading: Shows spinner during requests
 * - Auth: Adds Bearer token automatically
 * - Error: Shows user-friendly error notifications
 */
@Injectable({ providedIn: 'root' })
export class SubjectsService {
  private base = '/api/subjects';

  constructor(private http: HttpClient) {}

  /**
   * Get all class levels for select/dropdown (without pagination)
   * @returns Observable of ClassLevelDto array sorted by level
   */
  getClassLevels(): Observable<ClassLevelDto[]> {
    return this.http.get<ClassLevelDto[]>('/api/class-levels/all');
  }

  /**
   * Get list of all active subjects
   * @returns Observable of SubjectDto array
   */
  list(): Observable<SubjectDto[]> {
    return this.http.get<SubjectDto[]>(this.base);
  }

  /**
   * Get subjects by class level ID (for dropdowns/selects)
   * @param classLevelId Class level UUID
   * @returns Observable of SubjectDto array filtered by class level
   */
  getByClassLevel(classLevelId: string): Observable<SubjectDto[]> {
    return this.http.get<SubjectDto[]>(`${this.base}/by-class-level/${classLevelId}`);
  }

  /**
   * Get paginated list of all active subjects
   * @param page Page number (0-indexed)
   * @param size Page size
   * @returns Observable of PagedResponse with SubjectDto
   */
  listPaged(page: number = 0, size: number = 10): Observable<PagedResponse<SubjectDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PagedResponse<SubjectDto>>(this.base, { params });
  }

  /**
   * Get one subject by ID
   * @param id Subject UUID
   * @returns Observable of SubjectDto
   */
  getOne(id: string): Observable<SubjectDto> {
    return this.http.get<SubjectDto>(`${this.base}/${id}`);
  }

  /**
   * Create a new subject
   * Requires ADMIN or SUPER_ADMIN role
   * @param body Subject creation data
   * @returns Observable of created SubjectDto
   */
  create(body: CreateSubjectBody): Observable<SubjectDto> {
    return this.http.post<SubjectDto>(this.base, body);
  }

  /**
   * Update a subject
   * Requires ADMIN or SUPER_ADMIN role
   * @param id Subject UUID
   * @param body Update data
   * @returns Observable of updated SubjectDto
   */
  update(id: string, body: UpdateSubjectBody): Observable<SubjectDto> {
    return this.http.put<SubjectDto>(`${this.base}/${id}`, body);
  }
}
