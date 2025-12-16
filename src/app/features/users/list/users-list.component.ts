import { Component, OnInit, inject, computed, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UsersService, UserDto } from '../users.service';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { TranslateModule } from '@ngx-translate/core';
import { UserCreateComponent } from '../create/user-create.component';
import { UserEditComponent } from '../edit/user-edit.component';
import { TokenStorage } from '../../../core/auth/token-storage.service';
import { ImgproxyPipe } from '../../../shared/pipes/imgproxy.pipe';
import { LazyImageDirective } from '../../../shared/directives/lazy-image.directive';

/**
 * Users List Component
 *
 * Features:
 * - Displays users in Material table
 * - Create button (only for ADMIN/SUPER_ADMIN)
 * - Auto-refresh after creating user
 * - Uses all interceptors (loading, auth, error)
 */
@Component({
  standalone: true,
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatPaginatorModule,
    TranslateModule,
    ImgproxyPipe,
    LazyImageDirective
  ]
})
export class UsersListComponent implements OnInit {
  private api = inject(UsersService);
  private dialog = inject(MatDialog);
  private tokens = inject(TokenStorage);
  private router = inject(Router);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Track current view type (students or staff)
  private _viewType = signal<'students' | 'staff'>('students');
  viewType = computed(() => this._viewType());

  // Reactive state using signals
  private _users = signal<UserDto[]>([]);
  users = computed(() => this._users());

  // Pagination state
  private _totalElements = signal(0);
  totalElements = computed(() => this._totalElements());
  pageSize = 10;
  pageIndex = 0;

  // Dynamic columns based on view type
  displayed: string[] = ['avatar', 'fullName', 'email', 'role', 'status', 'actions'];

  // Show deleted users toggle
  private _showDeleted = signal(false);
  showDeleted = computed(() => this._showDeleted());

  ngOnInit(): void {
    // Detect route and set view type
    const url = this.router.url;
    if (url.includes('/students')) {
      this._viewType.set('students');
      // Add class column for students
      this.displayed = ['avatar', 'fullName', 'class', 'email', 'role', 'status', 'actions'];
    } else if (url.includes('/staff')) {
      this._viewType.set('staff');
      // Default columns for staff
      this.displayed = ['avatar', 'fullName', 'email', 'role', 'status', 'actions'];
    }

    this.load();
  }

  /**
   * Load users from API based on view type
   * Automatically shows loading spinner via loading interceptor
   * Automatically shows errors via error interceptor
   */
  load(): void {
    let request: any;

    if (this._showDeleted()) {
      request = this.api.listDeletedPaged(this.pageIndex, this.pageSize);
    } else if (this._viewType() === 'students') {
      request = this.api.listStudentsPaged(this.pageIndex, this.pageSize);
    } else {
      request = this.api.listStaffPaged(this.pageIndex, this.pageSize);
    }

    request.subscribe({
      next: (response: any) => {
        this._users.set(response.content || []);
        this._totalElements.set(response.totalElements || 0);
      }
      // Errors handled automatically by error interceptor
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
   * Toggle show deleted users
   */
  toggleDeleted(): void {
    this._showDeleted.set(!this._showDeleted());
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.load();
  }

  /**
   * Get page title based on view type
   */
  getPageTitle(): string {
    return this._viewType() === 'students' ? 'NAV.STUDENTS' : 'NAV.STAFF';
  }

  /**
   * Check if current user can create users
   * Only ADMIN and SUPER_ADMIN can create users
   */
  canCreate(): boolean {
    const roles = this.tokens.decode()?.roles ?? [];
    return roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
  }

  /**
   * Open create user dialog
   * Refreshes list if user was created
   */
  openCreate(): void {
    const dialogRef = this.dialog.open(UserCreateComponent, {
      width: '50vw',
      minWidth: '320px',
      maxWidth: '90vw',
      maxHeight: '85vh',
      disableClose: false,
      hasBackdrop: true,
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe((createdUser) => {
      if (createdUser) {
        console.log('User created:', createdUser);
        this.load(); // Refresh the list
      }
    });
  }

  /**
   * Open edit user dialog
   * Refreshes list if user was updated
   */
  openEdit(user: UserDto): void {
    const dialogRef = this.dialog.open(UserEditComponent, {
      width: '50vw',
      minWidth: '320px',
      maxWidth: '90vw',
      maxHeight: '85vh',
      disableClose: false,
      hasBackdrop: true,
      panelClass: 'custom-dialog-container',
      data: user
    });

    dialogRef.afterClosed().subscribe((updatedUser) => {
      if (updatedUser) {
        console.log('User updated:', updatedUser);
        this.load(); // Refresh the list
      }
    });
  }

  /**
   * Activate user
   */
  onActivate(user: UserDto): void {
    if (!confirm(`Activate user ${user.fullName}?`)) return;

    this.api.activate(user.id).subscribe({
      next: () => {
        console.log('User activated:', user.fullName);
        this.load();
      }
    });
  }

  /**
   * Deactivate user
   */
  onDeactivate(user: UserDto): void {
    if (!confirm(`Deactivate user ${user.fullName}?`)) return;

    this.api.deactivate(user.id).subscribe({
      next: () => {
        console.log('User deactivated:', user.fullName);
        this.load();
      }
    });
  }

  /**
   * Delete user (soft delete)
   */
  onDelete(user: UserDto): void {
    if (!confirm(`Delete user ${user.fullName}? This will mark the user as deleted and inactive.`)) return;

    this.api.delete(user.id).subscribe({
      next: () => {
        console.log('User deleted:', user.fullName);
        this.load();
      }
    });
  }

  /**
   * View user card (student or staff)
   */
  viewCard(user: UserDto): void {
    if (user.role === 'STUDENT') {
      this.router.navigate(['/app/students', user.id, 'card']);
    } else {
      this.router.navigate(['/app/staff', user.id, 'card']);
    }
  }
}
