import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ClassesService, ClassDto } from '../classes.service';
import { UserDto } from '../../users/users.service';
import { ClassStudentCreateComponent } from './class-student-create.component';

@Component({
  standalone: true,
  selector: 'app-class-card',
  templateUrl: './class-card.component.html',
  styleUrls: ['./class-card.component.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressBarModule,
    MatDialogModule
  ]
})
export class ClassCardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private classesApi = inject(ClassesService);
  private dialog = inject(MatDialog);

  private _classItem = signal<ClassDto | null>(null);
  classItem = computed(() => this._classItem());

  private _students = signal<UserDto[]>([]);
  students = computed(() => this._students());

  private _loading = signal(true);
  loading = computed(() => this._loading());

  private _error = signal('');
  error = computed(() => this._error());

  displayedStudents = ['fullName', 'email', 'status'];
  private classId: string | null = null;

  ngOnInit(): void {
    this.classId = this.route.snapshot.paramMap.get('id');
    if (!this.classId) {
      this._error.set('Class ID not provided');
      this._loading.set(false);
      return;
    }

    this.load(this.classId);
  }

  load(classId: string): void {
    if (!classId) {
      this._error.set('Class ID not provided');
      this._loading.set(false);
      return;
    }

    this._loading.set(true);
    this._error.set('');

    this.classesApi.getOne(classId).subscribe({
      next: (classItem) => {
        this._classItem.set(classItem);
        this._students.set(classItem.students || []);
        this._loading.set(false);
      },
      error: () => {
        this._error.set('Failed to load class card');
        this._loading.set(false);
      }
    });
  }

  openAddStudent(): void {
    const classItem = this._classItem();
    if (!classItem || !this.classId) return;

    const dialogRef = this.dialog.open(ClassStudentCreateComponent, {
      width: '50vw',
      minWidth: '320px',
      maxWidth: '90vw',
      maxHeight: '85vh',
      disableClose: false,
      hasBackdrop: true,
      panelClass: 'custom-dialog-container',
      data: {
        classId: this.classId,
        classCode: this.getClassCode()
      }
    });

    dialogRef.afterClosed().subscribe((createdStudent) => {
      if (createdStudent) {
        this.load(this.classId as string);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/app/classes']);
  }

  getTeacherName(): string {
    const classItem = this._classItem();
    return classItem?.classTeacherFullName
      || classItem?.teacher?.fullName
      || classItem?.classTeacher?.fullName
      || 'Not assigned';
  }

  getClassCode(): string {
    const classItem = this._classItem();
    return classItem?.code || classItem?.classInfo?.code || '-';
  }

  getLangType(): string {
    const classItem = this._classItem();
    return classItem?.langType || classItem?.classInfo?.langType || '-';
  }


  getStatusLabel(student: UserDto): string {
    if (student.status) return student.status;
    return student.isActive ? 'ACTIVE' : 'INACTIVE';
  }

  isActive(student: UserDto): boolean {
    if (typeof student.isActive === 'boolean') return student.isActive;
    return student.status === 'ACTIVE';
  }
}
