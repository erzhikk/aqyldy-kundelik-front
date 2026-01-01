import { Component, OnInit, inject, signal, computed, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { UsersService, StudentCardDto } from '../users.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ImgproxyPipe } from '../../../shared/pipes/imgproxy.pipe';
import { LazyImageDirective } from '../../../shared/directives/lazy-image.directive';
import { ImgproxyService } from '../../../core/services/imgproxy.service';
import { MediaService } from '../../../core/services/media.service';
import { NotifyService } from '../../../core/ui/notify.service';
import { StudentActionsSheetComponent, StudentAction } from './student-actions-sheet.component';
import { StudentTopicPerformanceComponent } from '../../assess/analytics/student-topic-performance.component';

/**
 * Student Card Component
 *
 * Displays detailed student information including:
 * - Personal details (name, email, date of birth)
 * - Class information
 * - Attendance statistics with visual indicators
 * - Topic performance analytics
 */
@Component({
  standalone: true,
  selector: 'app-student-card',
  templateUrl: './student-card.component.html',
  styleUrls: ['./student-card.component.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatBottomSheetModule,
    TranslateModule,
    ImgproxyPipe,
    LazyImageDirective,
    StudentTopicPerformanceComponent
  ]
})
export class StudentCardComponent implements OnInit {
  private api = inject(UsersService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private imgproxyService = inject(ImgproxyService);
  private mediaService = inject(MediaService);
  private notify = inject(NotifyService);
  private breakpointObserver = inject(BreakpointObserver);
  private bottomSheet = inject(MatBottomSheet);

  // File input reference
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Reactive state
  private _student = signal<StudentCardDto | null>(null);
  student = computed(() => this._student());

  private _loading = signal(true);
  loading = computed(() => this._loading());

  private _error = signal<string | null>(null);
  error = computed(() => this._error());

  // Avatar handling
  defaultAvatar = '/assets/avatar-default.svg';
  private broken = signal(false);

  // Upload state
  private _uploading = signal(false);
  uploading = computed(() => this._uploading());

  private _uploadProgress = signal(0);
  uploadProgress = computed(() => this._uploadProgress());

  // Mobile detection
  private _isMobile = signal(false);
  isMobile = computed(() => this._isMobile());

  constructor() {
    // Reset broken flag when student changes
    effect(() => {
      const studentData = this.student();
      if (studentData) {
        this.broken.set(false); // Reset error flag on new student
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    const studentId = this.route.snapshot.paramMap.get('id');
    if (studentId) {
      this.loadStudentCard(studentId);
    } else {
      this._error.set('Student ID not provided');
      this._loading.set(false);
    }

    // Detect mobile breakpoint
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe(result => {
        this._isMobile.set(result.matches);
      });
  }

  /**
   * Load student card from API
   */
  loadStudentCard(studentId: string): void {
    this._loading.set(true);
    this._error.set(null);

    this.api.getStudentCard(studentId).subscribe({
      next: (data) => {
        this._student.set(data);
        this._loading.set(false);
      },
      error: (err) => {
        this._error.set('Failed to load student card');
        this._loading.set(false);
        console.error('Error loading student card:', err);
      }
    });
  }

  /**
   * Go back to students list
   */
  goBack(): void {
    this.router.navigate(['/app/students']);
  }

  /**
   * Get status color based on student status
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'primary';
      case 'INACTIVE':
        return 'warn';
      default:
        return 'accent';
    }
  }

  /**
   * Get attendance rate color based on percentage
   */
  getAttendanceRateColor(rate: number): string {
    if (rate >= 90) return '#4caf50'; // green
    if (rate >= 75) return '#ff9800'; // orange
    return '#f44336'; // red
  }

  /**
   * Calculate percentage for attendance metrics
   */
  getPercentage(value: number, total: number): number {
    return total > 0 ? (value / total) * 100 : 0;
  }

  /**
   * Get photo source with fallback logic
   */
  photoSrc(): string {
    const url = this.student()?.photoUrl;
    return (!this.broken() && url) ? url : this.defaultAvatar;
  }

  /**
   * Handle image load error
   */
  onImgError(): void {
    this.broken.set(true);
  }

  /**
   * Handle file selection for photo upload
   */
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Reset input to allow selecting the same file again
    input.value = '';

    // Client-side validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      this.notify.error('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
      return;
    }

    if (file.size > maxSize) {
      this.notify.error('File size exceeds 5MB limit.');
      return;
    }

    const student = this.student();
    if (!student) {
      this.notify.error('Student data not available.');
      return;
    }

    try {
      this._uploading.set(true);
      this._uploadProgress.set(0);

      // Upload photo and get mediaObjectId
      const uploadResult = await this.mediaService.uploadPhotoDirect(
        student.id,
        file,
        (progress) => this._uploadProgress.set(progress)
      );

      // Update user with photoMediaId
      await this.api.update(student.id, {
        photoMediaId: uploadResult.mediaObjectId
      }).toPromise();

      this.notify.success('Photo uploaded successfully!');

      // Refresh card to get new photoUrl
      await this.refreshCard();
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      this.notify.error(error.message || 'Failed to upload photo.');
    } finally {
      this._uploading.set(false);
      this._uploadProgress.set(0);
    }
  }

  /**
   * Handle photo removal
   */
  async onRemovePhoto(): Promise<void> {
    const student = this.student();
    if (!student?.photoUrl) {
      this.notify.warning('No photo to remove.');
      return;
    }

    try {
      this._uploading.set(true);

      // Delete photo
      await this.api.deletePhoto(student.id).toPromise();

      this.notify.success('Photo removed successfully!');

      // Refresh card to clear photoUrl
      await this.refreshCard();
    } catch (error: any) {
      console.error('Error removing photo:', error);
      this.notify.error(error.message || 'Failed to remove photo.');
    } finally {
      this._uploading.set(false);
    }
  }

  /**
   * Refresh student card data
   */
  private async refreshCard(): Promise<void> {
    const student = this.student();
    if (!student) return;

    try {
      const data = await this.api.getStudentCard(student.id).toPromise();
      if (data) {
        this._student.set(data);
        this.broken.set(false); // Reset broken flag for new photo
      }
    } catch (error) {
      console.error('Error refreshing card:', error);
      this.notify.error('Failed to refresh student data.');
    }
  }

  /**
   * Open actions bottom sheet (mobile only)
   */
  openActionsSheet(): void {
    const student = this.student();
    if (!student) return;

    const sheetRef = this.bottomSheet.open(StudentActionsSheetComponent, {
      data: {
        studentId: student.id,
        hasPhoto: !!student.photoUrl
      }
    });

    sheetRef.afterDismissed().subscribe((action: StudentAction | undefined) => {
      if (!action) return;

      switch (action) {
        case 'upload':
          this.fileInput.nativeElement.click();
          break;
        case 'remove':
          this.onRemovePhoto();
          break;
        case 'edit':
          this.navigateToEdit();
          break;
      }
    });
  }

  /**
   * Navigate to edit page
   */
  navigateToEdit(): void {
    const student = this.student();
    if (!student) return;
    this.router.navigate(['/app/users/edit', student.id]);
  }
}
