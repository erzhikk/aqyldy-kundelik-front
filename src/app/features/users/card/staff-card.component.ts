import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService, StaffCardDto } from '../users.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslateModule } from '@ngx-translate/core';
import { ImgproxyPipe } from '../../../shared/pipes/imgproxy.pipe';
import { LazyImageDirective } from '../../../shared/directives/lazy-image.directive';

/**
 * Staff Card Component
 *
 * Displays detailed staff member information including:
 * - Personal details (name, email, role)
 * - Class teacher information (if applicable)
 * - Taught subjects with groups
 */
@Component({
  standalone: true,
  selector: 'app-staff-card',
  templateUrl: './staff-card.component.html',
  styleUrls: ['./staff-card.component.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    TranslateModule,
    ImgproxyPipe,
    LazyImageDirective
  ]
})
export class StaffCardComponent implements OnInit {
  private api = inject(UsersService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Reactive state
  private _staff = signal<StaffCardDto | null>(null);
  staff = computed(() => this._staff());

  private _loading = signal(true);
  loading = computed(() => this._loading());

  private _error = signal<string | null>(null);
  error = computed(() => this._error());

  ngOnInit(): void {
    const staffId = this.route.snapshot.paramMap.get('id');
    if (staffId) {
      this.loadStaffCard(staffId);
    } else {
      this._error.set('Staff ID not provided');
      this._loading.set(false);
    }
  }

  /**
   * Load staff card from API
   */
  loadStaffCard(staffId: string): void {
    this._loading.set(true);
    this._error.set(null);

    this.api.getStaffCard(staffId).subscribe({
      next: (data) => {
        this._staff.set(data);
        this._loading.set(false);
      },
      error: (err) => {
        this._error.set('Failed to load staff card');
        this._loading.set(false);
        console.error('Error loading staff card:', err);
      }
    });
  }

  /**
   * Go back to staff list
   */
  goBack(): void {
    this.router.navigate(['/app/staff']);
  }

  /**
   * Get status color based on staff status
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
   * Get role color based on staff role
   */
  getRoleColor(role: string): string {
    switch (role) {
      case 'TEACHER':
        return 'primary';
      case 'ADMIN':
        return 'accent';
      case 'SUPER_ADMIN':
        return 'warn';
      default:
        return '';
    }
  }

  /**
   * Get icon for role
   */
  getRoleIcon(role: string): string {
    switch (role) {
      case 'TEACHER':
        return 'school';
      case 'ADMIN':
        return 'admin_panel_settings';
      case 'SUPER_ADMIN':
        return 'supervisor_account';
      default:
        return 'person';
    }
  }
}
