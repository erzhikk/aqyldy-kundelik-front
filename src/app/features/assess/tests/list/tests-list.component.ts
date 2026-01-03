import { Component, OnInit, inject, computed, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { TestsService, TestDto, TestListParams } from '../tests.service';
import { SubjectsService, SubjectDto } from '../../../subjects/subjects.service';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { TokenStorage } from '../../../../core/auth/token-storage.service';

/**
 * Tests List Component
 *
 * Features:
 * - Displays tests in Material table
 * - Filters: Subject, Grade, Published status
 * - Search by title/description (q parameter)
 * - Pagination
 * - Create/Edit/Delete actions
 * - Publish functionality
 */
@Component({
  standalone: true,
  selector: 'app-tests-list',
  templateUrl: './tests-list.component.html',
  styleUrls: ['./tests-list.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    TranslateModule
  ]
})
export class TestsListComponent implements OnInit {
  private testsApi = inject(TestsService);
  private subjectsApi = inject(SubjectsService);
  private tokens = inject(TokenStorage);
  private router = inject(Router);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Table columns to display
  displayed = ['title', 'subject', 'grade', 'published', 'hasAttempts', 'actions'];

  // Reactive state using signals
  private _tests = signal<TestDto[]>([]);
  tests = computed(() => this._tests());

  private _subjects = signal<SubjectDto[]>([]);
  subjects = computed(() => this._subjects());

  // Pagination state
  private _totalElements = signal(0);
  totalElements = computed(() => this._totalElements());
  pageSize = 10;
  pageIndex = 0;

  // Filter controls
  subjectFilter = new FormControl<string | null>(null);
  gradeFilter = new FormControl<number | null>(null);
  publishedFilter = new FormControl<string | null>(null); // 'all' | 'true' | 'false'
  searchControl = new FormControl<string>('');

  // Grade options (1-11)
  grades = Array.from({ length: 11 }, (_, i) => i + 1);

  // Published filter options
  publishedOptions = [
    { value: 'all', label: 'All' },
    { value: 'true', label: 'Published' },
    { value: 'false', label: 'Draft' }
  ];

  ngOnInit(): void {
    this.loadSubjects();
    this.load();

    // Set default published filter
    this.publishedFilter.setValue('all');

    // Watch filter changes
    this.subjectFilter.valueChanges.subscribe(() => {
      this.pageIndex = 0;
      if (this.paginator) this.paginator.pageIndex = 0;
      this.load();
    });

    this.gradeFilter.valueChanges.subscribe(() => {
      this.pageIndex = 0;
      if (this.paginator) this.paginator.pageIndex = 0;
      this.load();
    });

    this.publishedFilter.valueChanges.subscribe(() => {
      this.pageIndex = 0;
      if (this.paginator) this.paginator.pageIndex = 0;
      this.load();
    });

    // Watch search with debounce
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.pageIndex = 0;
        if (this.paginator) this.paginator.pageIndex = 0;
        this.load();
      });
  }

  /**
   * Load subjects for filter dropdown
   */
  loadSubjects(): void {
    this.subjectsApi.list().subscribe({
      next: (subjects) => {
        this._subjects.set(subjects);
      }
    });
  }

  /**
   * Load tests from API with filters
   */
  load(): void {
    const params: TestListParams = {
      page: this.pageIndex,
      size: this.pageSize
    };

    // Apply filters
    if (this.subjectFilter.value) {
      params.subjectId = this.subjectFilter.value;
    }

    if (this.gradeFilter.value !== null) {
      params.grade = this.gradeFilter.value;
    }

    if (this.publishedFilter.value && this.publishedFilter.value !== 'all') {
      params.published = this.publishedFilter.value === 'true';
    }

    if (this.searchControl.value) {
      params.q = this.searchControl.value;
    }

    this.testsApi.list(params).subscribe({
      next: (response) => {
        this._tests.set(response.content || []);
        this._totalElements.set(response.totalElements || 0);
      }
    });
  }

  /**
   * Handle page change event from paginator
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.subjectFilter.setValue(null);
    this.gradeFilter.setValue(null);
    this.publishedFilter.setValue('all');
    this.searchControl.setValue('');
  }

  /**
   * Check if current user can create/edit tests
   */
  canManage(): boolean {
    const roles = this.tokens.decode()?.roles ?? [];
    return roles.includes('ADMIN') ||
           roles.includes('SUPER_ADMIN') ||
           roles.includes('TEACHER') ||
           roles.includes('ADMIN_ASSESSMENT');
  }

  /**
   * Navigate to create test page
   */
  create(): void {
    this.router.navigate(['/app/assess/tests/new']);
  }

  /**
   * Navigate to edit test page
   */
  edit(test: TestDto): void {
    this.router.navigate(['/app/assess/tests', test.id, 'edit']);
  }

  /**
   * Delete a test
   * Will show error via interceptor if test has attempts (409 Conflict)
   */
  delete(test: TestDto): void {
    if (!confirm(`Are you sure you want to delete test "${test.title}"?`)) {
      return;
    }

    this.testsApi.delete(test.id).subscribe({
      next: () => {
        this.load(); // Reload list
      }
      // Error handled automatically by interceptor (409 if has attempts)
    });
  }

  /**
   * Publish a test
   * After publishing, test composition cannot be edited
   */
  publish(test: TestDto): void {
    if (!confirm(`Publish test "${test.title}"? After publishing, you cannot edit the test composition.`)) {
      return;
    }

    this.testsApi.publish(test.id).subscribe({
      next: () => {
        this.load(); // Reload list
      }
    });
  }

  /**
   * Get subject name by ID
   */
  getSubjectName(subjectId: string): string {
    const subject = this._subjects().find(s => s.id === subjectId);
    return subject?.nameRu || subject?.nameEn || 'Unknown';
  }
}
