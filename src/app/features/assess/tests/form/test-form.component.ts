import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TestsService, TestDto, CreateTestBody, UpdateTestBody, ReviewPolicy } from '../tests.service';
import { SubjectsService, SubjectDto } from '../../../subjects/subjects.service';
import { ClassesService, ClassDto } from '../../../classes/classes.service';
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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
    MatSliderModule,
    TranslateModule
  ]
})
export class TestFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private testsApi = inject(TestsService);
  private subjectsApi = inject(SubjectsService);
  private classesApi = inject(ClassesService);
  private notify = inject(NotifyService);
  private translate = inject(TranslateService);

  form!: FormGroup;
  loading = false;
  isEditMode = false;
  testId: string | null = null;
  currentTest: TestDto | null = null;
  subjects: SubjectDto[] = [];
  schoolClasses: ClassDto[] = [];

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
      schoolClassIds: [[], [Validators.required, Validators.minLength(1)]],
      subjectId: ['', [Validators.required]],

      // Scheduling
      opensAt: [null],
      opensTime: [''],
      closesAt: [null],
      closesTime: [''],

      // Test settings
      durationSec: [3600, [Validators.required, Validators.min(60), Validators.max(14400)]],
      allowedAttempts: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      passingPercent: [70, [Validators.required, Validators.min(0), Validators.max(100)]],

      // Options
      shuffleQuestions: [false],
      shuffleChoices: [false],
      reviewPolicy: ['AFTER_SUBMIT' as ReviewPolicy, [Validators.required]]
    }, { validators: this.validateTestSchedule.bind(this) });

    // Load school classes and subjects
    this.loadSchoolClasses();
    this.loadSubjects();

    // Load test data if in edit mode
    if (this.isEditMode && this.testId) {
      this.loadTest(this.testId);
    }
  }

  /**
   * Load school classes for dropdown
   */
  loadSchoolClasses(): void {
    this.classesApi.listAll().subscribe({
      next: (schoolClasses) => {
        this.schoolClasses = schoolClasses;
      },
      error: (err) => {
        console.error('Error loading school classes:', err);
        this.notify.error(this.translate.instant('TEST_FORM.NOTIFY_SCHOOL_CLASSES_FAIL'));
        this.schoolClasses = [];
      }
    });
  }

  /**
   * Load all subjects from API
   */
  loadSubjects(): void {
    this.subjectsApi.list().subscribe({
      next: (response: any) => {
        // Handle both array and paginated response
        const subjects = Array.isArray(response)
          ? response
          : (response?.content ?? response?.data ?? []);
        this.subjects = subjects;
      },
      error: () => {
        this.notify.error(this.translate.instant('TEST_FORM.NOTIFY_SUBJECTS_FAIL'));
        this.subjects = [];
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

        // Extract schoolClassIds from test (assuming API returns it)
        const schoolClassIds = test.schoolClassIds || (test.schoolClasses || []).map((schoolClass: ClassDto) => schoolClass.id) || [];

        // Extract time from opensAt
        let opensTime = '';
        let opensDate = null;
        if (test.opensAt) {
          const opensDateTime = new Date(test.opensAt);
          opensDate = opensDateTime;
          opensTime = this.formatTimeForInput(opensDateTime);
        }

        // Extract time from closesAt
        let closesTime = '';
        let closesDate = null;
        if (test.closesAt) {
          const closesDateTime = new Date(test.closesAt);
          closesDate = closesDateTime;
          closesTime = this.formatTimeForInput(closesDateTime);
        }

        // Set form values
        this.form.patchValue({
          name: test.name || test.title || '',
          description: test.description || '',
          schoolClassIds: schoolClassIds,
          subjectId: test.subjectId,
          opensAt: opensDate,
          opensTime: opensTime,
          closesAt: closesDate,
          closesTime: closesTime,
          durationSec: test.durationSec || 3600,
          allowedAttempts: test.allowedAttempts || 1,
          passingPercent: test.passingPercent || 70,
          shuffleQuestions: test.shuffleQuestions || false,
          shuffleChoices: test.shuffleChoices || false,
          reviewPolicy: test.reviewPolicy || 'AFTER_SUBMIT'
        });

        // Disable form if published
        if (test.published === true || test.status === 'PUBLISHED') {
          this.form.disable();
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading test:', err);
        this.notify.error(this.translate.instant('TEST_FORM.NOTIFY_TEST_LOAD_FAIL'));
        this.loading = false;
        this.goBack();
      }
    });
  }

  /**
   * Check if test is published
   */
  isPublished(): boolean {
    if (!this.currentTest) return false;
    if (typeof this.currentTest.published === 'boolean') return this.currentTest.published;
    return this.currentTest.status === 'PUBLISHED';
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
      this.notify.warning(this.translate.instant('TEST_FORM.NOTIFY_PUBLISHED_BLOCK'));
      return;
    }

    this.loading = true;
    const formValue = this.form.value;

    // Combine date and time for opensAt
    let opensAtISO: string | null = null;
    if (formValue.opensAt && formValue.opensTime) {
      const opensDateTime = this.combineDateAndTime(formValue.opensAt, formValue.opensTime);
      opensAtISO = opensDateTime ? opensDateTime.toISOString() : null;
    }

    // Combine date and time for closesAt
    let closesAtISO: string | null = null;
    if (formValue.closesAt && formValue.closesTime) {
      const closesDateTime = this.combineDateAndTime(formValue.closesAt, formValue.closesTime);
      closesAtISO = closesDateTime ? closesDateTime.toISOString() : null;
    }

    if (this.isEditMode && this.testId) {
      // Update existing test
      const body: UpdateTestBody = {
        name: formValue.name,
        description: formValue.description || null,
        subjectId: formValue.subjectId,
        schoolClassIds: formValue.schoolClassIds,
        durationSec: formValue.durationSec,
        allowedAttempts: formValue.allowedAttempts,
        opensAt: opensAtISO,
        closesAt: closesAtISO,
        shuffleQuestions: formValue.shuffleQuestions,
        shuffleChoices: formValue.shuffleChoices,
        passingPercent: formValue.passingPercent,
        reviewPolicy: formValue.reviewPolicy
      };

      this.testsApi.update(this.testId, body).subscribe({
        next: () => {
          this.loading = false;
          this.notify.success(this.translate.instant('TEST_FORM.NOTIFY_UPDATE_SUCCESS'));
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
        schoolClassIds: formValue.schoolClassIds,
        durationSec: formValue.durationSec,
        allowedAttempts: formValue.allowedAttempts,
        opensAt: opensAtISO,
        closesAt: closesAtISO,
        shuffleQuestions: formValue.shuffleQuestions,
        shuffleChoices: formValue.shuffleChoices,
        passingPercent: formValue.passingPercent,
        reviewPolicy: formValue.reviewPolicy
      };

      this.testsApi.create(body).subscribe({
        next: () => {
          this.loading = false;
          this.notify.success(this.translate.instant('TEST_FORM.NOTIFY_CREATE_SUCCESS'));
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

    // Check if composition plan is fulfilled
    if (!this.isCompositionPlanFulfilled()) {
      const message = this.getPlanFulfillmentMessage();
      this.notify.warning(message || 'План структуры теста не выполнен');
      return;
    }

    if (!confirm(this.translate.instant('TEST_FORM.CONFIRM_PUBLISH'))) {
      return;
    }

    this.loading = true;
    this.testsApi.publish(this.testId).subscribe({
      next: () => {
        this.loading = false;
        this.notify.success(this.translate.instant('TEST_FORM.NOTIFY_PUBLISH_SUCCESS'));
        this.goBack();
      },
      error: () => {
        this.loading = false;
        // Error handled by interceptor
      }
    });
  }

  /**
   * Check if test composition plan is fulfilled
   */
  isCompositionPlanFulfilled(): boolean {
    if (!this.testId) return true;

    const key = `testPlan_${this.testId}`;
    const stored = sessionStorage.getItem(key);

    if (!stored) {
      return true;
    }

    try {
      const plan = JSON.parse(stored);

      return plan.topicPlans.every((tp: any) => {
        return tp.selectedQuestionIds.length >= tp.targetCount;
      });
    } catch (e) {
      console.error('Failed to parse test plan:', e);
      return true;
    }
  }

  /**
   * Get plan fulfillment message
   */
  getPlanFulfillmentMessage(): string {
    if (!this.testId) return '';

    const key = `testPlan_${this.testId}`;
    const stored = sessionStorage.getItem(key);

    if (!stored) return '';

    try {
      const plan = JSON.parse(stored);
      const unfulfilled = plan.topicPlans.filter((tp: any) =>
        tp.selectedQuestionIds.length < tp.targetCount
      );

      if (unfulfilled.length > 0) {
        return `План не выполнен: не хватает вопросов по топикам: ${unfulfilled.map((tp: any) => tp.topicName).join(', ')}`;
      }

      return '';
    } catch (e) {
      return '';
    }
  }

  /**
   * Delete test
   */
  delete(): void {
    if (!this.testId || this.loading) return;

    if (this.hasAttempts()) {
      this.notify.error(this.translate.instant('TEST_FORM.NOTIFY_DELETE_BLOCK'));
      return;
    }

    if (!confirm(this.translate.instant('TEST_FORM.CONFIRM_DELETE'))) {
      return;
    }

    this.loading = true;
    this.testsApi.delete(this.testId).subscribe({
      next: () => {
        this.loading = false;
        this.notify.success(this.translate.instant('TEST_FORM.NOTIFY_DELETE_SUCCESS'));
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
    return this.translate.instant(this.isEditMode ? 'TEST_FORM.TITLE_EDIT' : 'TEST_FORM.TITLE_CREATE');
  }

  /**
   * Get submit button text
   */
  getSubmitButtonText(): string {
    if (this.loading) {
      return this.translate.instant(this.isEditMode ? 'TEST_FORM.ACTION_UPDATING' : 'TEST_FORM.ACTION_CREATING');
    }
    return this.translate.instant(this.isEditMode ? 'TEST_FORM.ACTION_UPDATE' : 'TEST_FORM.ACTION_CREATE');
  }

  /**
   * Custom validator to check test schedule respects duration
   */
  validateTestSchedule(formGroup: FormGroup): { [key: string]: any } | null {
    const opensAt = formGroup.get('opensAt')?.value;
    const opensTime = formGroup.get('opensTime')?.value;
    const closesAt = formGroup.get('closesAt')?.value;
    const closesTime = formGroup.get('closesTime')?.value;
    const durationSec = formGroup.get('durationSec')?.value;

    // If any field is missing, skip validation
    if (!opensAt || !opensTime || !closesAt || !closesTime || !durationSec) {
      return null;
    }

    // Combine date and time into full datetime
    const opensDateTime = this.combineDateAndTime(opensAt, opensTime);
    const closesDateTime = this.combineDateAndTime(closesAt, closesTime);

    if (!opensDateTime || !closesDateTime) {
      return null;
    }

    // Calculate time difference in seconds
    const diffMs = closesDateTime.getTime() - opensDateTime.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    // Check if close time is at least durationSec after open time
    if (diffSec < durationSec) {
      return {
        scheduleInvalid: {
          message: 'Close time must be at least the test duration after open time',
          required: durationSec,
          actual: diffSec
        }
      };
    }

    return null;
  }

  /**
   * Combine date and time strings into Date object
   */
  combineDateAndTime(date: Date | string, time: string): Date | null {
    if (!date || !time) return null;

    const dateObj = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);

    if (isNaN(hours) || isNaN(minutes)) return null;

    dateObj.setHours(hours, minutes, 0, 0);
    return dateObj;
  }

  /**
   * Format Date object to HH:MM for time input
   */
  formatTimeForInput(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
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
