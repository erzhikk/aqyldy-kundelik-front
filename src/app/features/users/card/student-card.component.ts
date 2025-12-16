import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService, StudentCardDto } from '../users.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { ImgproxyPipe } from '../../../shared/pipes/imgproxy.pipe';
import { LazyImageDirective } from '../../../shared/directives/lazy-image.directive';
import { ImgproxyService } from '../../../core/services/imgproxy.service';

/**
 * Student Card Component
 *
 * Displays detailed student information including:
 * - Personal details (name, email, date of birth)
 * - Class information
 * - Attendance statistics with visual indicators
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
    TranslateModule,
    ImgproxyPipe,
    LazyImageDirective
  ]
})
export class StudentCardComponent implements OnInit {
  private api = inject(UsersService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private imgproxyService = inject(ImgproxyService);

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
}
