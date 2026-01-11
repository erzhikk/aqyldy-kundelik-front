import { Component, OnInit, inject, computed, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClassesService, ClassDto } from '../classes.service';
import { UsersService, UserDto } from '../../users/users.service';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { ClassCreateComponent } from '../create/class-create.component';
import { ClassEditComponent } from '../edit/class-edit.component';
import { TokenStorage } from '../../../core/auth/token-storage.service';
import { forkJoin } from 'rxjs';

/**
 * Classes List Component
 *
 * Features:
 * - Displays classes in Material table
 * - Create button (only for ADMIN/SUPER_ADMIN)
 * - Auto-refresh after creating class
 * - Uses all interceptors (loading, auth, error)
 */
@Component({
  standalone: true,
  selector: 'app-classes-list',
  templateUrl: './classes-list.component.html',
  styleUrls: ['./classes-list.component.scss'],
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatTooltipModule,
    MatPaginatorModule
  ]
})
export class ClassesListComponent implements OnInit {
  private api = inject(ClassesService);
  private usersService = inject(UsersService);
  private dialog = inject(MatDialog);
  private tokens = inject(TokenStorage);
  private router = inject(Router);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Table columns to display
  displayed = ['code', 'langType', 'classTeacher', 'actions'];

  // Reactive state using signals
  private _classes = signal<ClassDto[]>([]);
  classes = computed(() => this._classes());

  // Pagination state
  private _totalElements = signal(0);
  totalElements = computed(() => this._totalElements());
  pageSize = 10;
  pageIndex = 0;

  // Teachers map for quick lookup
  private _teachers = signal<Map<string, UserDto>>(new Map());

  ngOnInit(): void {
    this.load();
  }

  /**
   * Load classes and teachers from API
   * Automatically shows loading spinner via loading interceptor
   * Automatically shows errors via error interceptor
   */
  load(): void {
    forkJoin({
      classes: this.api.listPaged(this.pageIndex, this.pageSize),
      users: this.usersService.list()
    }).subscribe({
      next: (result) => {
        this._classes.set(result.classes.content || []);
        this._totalElements.set(result.classes.totalElements || 0);

        // Create teachers map
        const teachersMap = new Map<string, UserDto>();
        (result.users || [])
          .filter(u => u.role === 'TEACHER')
          .forEach(teacher => teachersMap.set(teacher.id, teacher));
        this._teachers.set(teachersMap);
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
   * Get teacher name by ID
   */
  getTeacherName(teacherId?: string | null): string {
    if (!teacherId) return 'Not assigned';
    const teacher = this._teachers().get(teacherId);
    return teacher?.fullName ?? 'Unknown';
  }

  /**
   * Check if current user can create classes
   * Only ADMIN and SUPER_ADMIN can create classes
   */
  canCreate(): boolean {
    const roles = this.tokens.decode()?.roles ?? [];
    return roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
  }

  /**
   * Open create class dialog
   * Refreshes list if class was created
   */
  openCreate(): void {
    const dialogRef = this.dialog.open(ClassCreateComponent, {
      width: '50vw',
      minWidth: '320px',
      maxWidth: '90vw',
      maxHeight: '85vh',
      disableClose: false,
      hasBackdrop: true,
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe((createdClass) => {
      if (createdClass) {
        console.log('Class created:', createdClass);
        this.load(); // Refresh the list
      }
    });
  }

  /**
   * Open edit class dialog
   * Refreshes list if class was updated
   */
  openEdit(classItem: ClassDto): void {
    const dialogRef = this.dialog.open(ClassEditComponent, {
      width: '50vw',
      minWidth: '320px',
      maxWidth: '90vw',
      maxHeight: '85vh',
      disableClose: false,
      hasBackdrop: true,
      panelClass: 'custom-dialog-container',
      data: classItem
    });

    dialogRef.afterClosed().subscribe((updatedClass) => {
      if (updatedClass) {
        console.log('Class updated:', updatedClass);
        this.load(); // Refresh the list
      }
    });
  }

  /**
   * Delete class
   */
  onDelete(classItem: ClassDto): void {
    if (!confirm(`Delete class ${classItem.code}?`)) return;

    this.api.delete(classItem.id).subscribe({
      next: () => {
        console.log('Class deleted:', classItem.code);
        this.load();
      }
    });
  }

  /**
   * Open class card
   */
  openCard(classItem: ClassDto): void {
    this.router.navigate(['/app/classes', classItem.id, 'card']);
  }
}
