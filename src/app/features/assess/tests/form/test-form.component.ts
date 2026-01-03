import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TestsService, TestDto, CreateTestBody, UpdateTestBody, ReviewPolicy } from '../tests.service';
import { SubjectsService, SubjectDto, ClassLevelDto } from '../../../subjects/subjects.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSliderModule } from '@angular/material/slider';
import { NotifyService } from '../../../../core/ui/notify.service';

/**
 * Test Form Component
 *
 * Used for both creating and editing tests.
 * Mode determined by presence of :id route parameter.
 *
 * Features:
 * - Create new test
 * - Edit existing test (blocked if published)
 * - Publish test
 * - Delete test (disabled if has attempts)
 * - Form validation
 */
@Component({
  standalone: true,
  selector: 'app-test-form',
  templateUrl: './test-form.component.html',
  styleUrls: ['./test-form.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSliderModule
  ]
})
export class TestFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private testsApi = inject(TestsService);
  private subjectsApi = inject(SubjectsService);
  private notify = inject(NotifyService);

  form!: FormGroup;
  loading = false;
  isEditMode = false;
  testId: string | null = null;
  currentTest: TestDto | null = null;
  subjects: SubjectDto[] = [];
  classLevels: ClassLevelDto[] = [];

  // Review policy options
  reviewPolicyOptions: { value: ReviewPolicy; label: string; description: string }[] = [
    {
      value: 'AFTER_SUBMIT',
      label: 'After Submit',
      description: 'Students can review immediately after submitting'
    },
    {
      value: 'AFTER_CLOSE',
      label: 'After Close',
      description: 'Students can review only after test closes'
    },
    {
      value: 'NEVER',
      label: 'Never',
      description: 'Students cannot review their answers'
    }
  ];

  ngOnInit(): void {
    // Check if we're in edit mode
    this.testId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.testId;

    // Initialize form
    this.form = this.fb.group({
      // Basic info
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(1000)]],
      classLevelId: ['', [Validators.required]],
      subjectId: ['', [Validators.required]],

      // Scheduling
      opensAt: [null],
      closesAt: [null],

      // Test settings
      durationSec: [3600, [Validators.required, Validators.min(60), Validators.max(14400)]],
      allowedAttempts: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      passingPercent: [70, [Validators.required, Validators.min(0), Validators.max(100)]],

      // Options
      shuffleQuestions: [false],
      shuffleChoices: [false],
      reviewPolicy: ['AFTER_SUBMIT' as ReviewPolicy, [Validators.required]]
    });

    // Load class levels
    this.loadClassLevels();

    // Watch classLevel changes to load subjects
    this.form.get('classLevelId')?.valueChanges.subscribe((classLevelId) => {
      this.loadSubjectsByClassLevel(classLevelId);
    });

    // Load test data if in edit mode
    if (this.isEditMode && this.testId) {
      this.loadTest(this.testId);
    }
  }

  /**
   * Load class levels for dropdown
   */
  loadClassLevels(): void {
    this.subjectsApi.getClassLevels().subscribe({
      next: (classLevels) => {
        this.classLevels = classLevels;
      },
      error: (err) => {
        console.error('Error loading class levels:', err);
        this.notify.error('Failed to load class levels');
        this.classLevels = [];
      }
    });
  }

  /**
   * Load subjects by class level from API
   *
   * Flow:
   * 1. User selects Class Level (e.g., Grade 5)
   * 2. Load subjects for that class level from backend (GET /api/subjects/by-class-level/{id})
   * 3. Preserve subject selection if it exists in the new list (for edit mode)
   * 4. Clear subject selection if it doesn't exist in the new list
   */
  loadSubjectsByClassLevel(classLevelId: string | null): void {
    if (!classLevelId) {
      this.subjects = [];
      this.form.patchValue({ subjectId: '' });
      return;
    }

    this.subjectsApi.getByClassLevel(classLevelId).subscribe({
      next: (subjects) => {
        this.subjects = subjects;

        // Clear subject selection when class level changes
        // But only if current subject is not in the new list (for edit mode)
        const currentSubjectId = this.form.get('subjectId')?.value;
        if (currentSubjectId) {
          const isSubjectAvailable = subjects.some(s => s.id === currentSubjectId);
          if (!isSubjectAvailable) {
            this.form.patchValue({ subjectId: '' });
          }
        } else {
          this.form.patchValue({ subjectId: '' });
        }
      },
      error: () => {
        this.notify.error('Failed to load subjects');
        this.subjects = [];
        this.form.patchValue({ subjectId: '' });
      }
    });
  }

  /**
   * Load test data for editing
   */
  loadTest(id: string): void {
    this.loading = true;
    this.testsApi.getOne(id).subscribe({
      next: (test: any) => {
        this.currentTest = test;

        // Find classLevelId from subject
        const subject = test.subject;
        const classLevelId = subject?.classLevel?.id || test.classLevelId || '';

        // Set form values
        this.form.patchValue({
          name: test.name || test.title || '',
          description: test.description || '',
          classLevelId: classLevelId,
          subjectId: test.subjectId,
          opensAt: test.opensAt ? new Date(test.opensAt) : null,
          closesAt: test.closesAt ? new Date(test.closesAt) : null,
          durationSec: test.durationSec || 3600,
          allowedAttempts: test.allowedAttempts || 1,
          passingPercent: test.passingPercent || 70,
          shuffleQuestions: test.shuffleQuestions || false,
          shuffleChoices: test.shuffleChoices || false,
          reviewPolicy: test.reviewPolicy || 'AFTER_SUBMIT'
        });

        // Disable form if published
        if (test.published) {
          this.form.disable();
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading test:', err);
        this.notify.error('Failed to load test');
        this.loading = false;
        this.goBack();
      }
    });
  }

  /**
   * Check if test is published
   */
  isPublished(): boolean {
    return this.currentTest?.published || false;
  }

  /**
   * Check if test has attempts
   */
  hasAttempts(): boolean {
    return this.currentTest?.hasAttempts || false;
  }

  /**
   * Submit form (create or update)
   */
  submit(): void {
    if (this.form.invalid || this.loading) return;

    if (this.isPublished()) {
      this.notify.warning('Cannot edit published test');
      return;
    }

    this.loading = true;
    const formValue = this.form.value;

    if (this.isEditMode && this.testId) {
      // Update existing test
      const body: UpdateTestBody = {
        name: formValue.name,
        description: formValue.description || null,
        subjectId: formValue.subjectId,
        classLevelId: formValue.classLevelId,
        durationSec: formValue.durationSec,
        allowedAttempts: formValue.allowedAttempts,
        opensAt: formValue.opensAt ? new Date(formValue.opensAt).toISOString() : null,
        closesAt: formValue.closesAt ? new Date(formValue.closesAt).toISOString() : null,
        shuffleQuestions: formValue.shuffleQuestions,
        shuffleChoices: formValue.shuffleChoices,
        passingPercent: formValue.passingPercent,
        reviewPolicy: formValue.reviewPolicy
      };

      this.testsApi.update(this.testId, body).subscribe({
        next: () => {
          this.loading = false;
          this.notify.success('Test updated successfully');
          this.goBack();
        },
        error: () => {
          this.loading = false;
          // Error handled by interceptor
        }
      });
    } else {
      // Create new test
      const body: CreateTestBody = {
        name: formValue.name,
        description: formValue.description || null,
        subjectId: formValue.subjectId,
        classLevelId: formValue.classLevelId,
        durationSec: formValue.durationSec,
        allowedAttempts: formValue.allowedAttempts,
        opensAt: formValue.opensAt ? new Date(formValue.opensAt).toISOString() : null,
        closesAt: formValue.closesAt ? new Date(formValue.closesAt).toISOString() : null,
        shuffleQuestions: formValue.shuffleQuestions,
        shuffleChoices: formValue.shuffleChoices,
        passingPercent: formValue.passingPercent,
        reviewPolicy: formValue.reviewPolicy
      };

      this.testsApi.create(body).subscribe({
        next: () => {
          this.loading = false;
          this.notify.success('Test created successfully');
          this.goBack();
        },
        error: () => {
          this.loading = false;
          // Error handled by interceptor
        }
      });
    }
  }

  /**
   * Publish test
   */
  publish(): void {
    if (!this.testId || this.loading || this.isPublished()) return;

    if (!confirm('Publish this test? After publishing, you cannot edit the test composition.')) {
      return;
    }

    this.loading = true;
    this.testsApi.publish(this.testId).subscribe({
      next: () => {
        this.loading = false;
        this.notify.success('Test published successfully');
        this.goBack();
      },
      error: () => {
        this.loading = false;
        // Error handled by interceptor
      }
    });
  }

  /**
   * Delete test
   */
  delete(): void {
    if (!this.testId || this.loading) return;

    if (this.hasAttempts()) {
      this.notify.error('Cannot delete test with student attempts');
      return;
    }

    if (!confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      return;
    }

    this.loading = true;
    this.testsApi.delete(this.testId).subscribe({
      next: () => {
        this.loading = false;
        this.notify.success('Test deleted successfully');
        this.goBack();
      },
      error: () => {
        this.loading = false;
        // Error handled by interceptor (409 if has attempts)
      }
    });
  }

  /**
   * Navigate to test composition
   */
  navigateToComposition(): void {
    if (!this.testId) return;
    this.router.navigate(['/app/assess/tests', this.testId, 'composition']);
  }

  /**
   * Go back to tests list
   */
  goBack(): void {
    this.router.navigate(['/app/assess/tests']);
  }

  /**
   * Get page title
   */
  getPageTitle(): string {
    return this.isEditMode ? 'Edit Test' : 'Create Test';
  }

  /**
   * Get submit button text
   */
  getSubmitButtonText(): string {
    if (this.loading) {
      return this.isEditMode ? 'Updating...' : 'Creating...';
    }
    return this.isEditMode ? 'Update Test' : 'Create Test';
  }

  /**
   * Format duration seconds to readable string
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Get duration control value in minutes for display
   */
  getDurationInMinutes(): number {
    return Math.floor((this.form.get('durationSec')?.value || 3600) / 60);
  }

  /**
   * Update duration in seconds from minutes input
   */
  updateDurationFromMinutes(minutes: number): void {
    this.form.patchValue({ durationSec: minutes * 60 });
  }
}
