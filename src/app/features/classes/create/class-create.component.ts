import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ClassesService, CreateClassBody } from '../classes.service';
import { UsersService, UserDto } from '../../users/users.service';
import { SubjectsService, ClassLevelDto } from '../../subjects/subjects.service';

const LANG_OPTIONS = ['kaz', 'rus', 'eng'];

@Component({
  standalone: true,
  selector: 'app-class-create',
  templateUrl: './class-create.component.html',
  styleUrls: ['./class-create.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ]
})
export class ClassCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ClassCreateComponent>);
  private api = inject(ClassesService);
  private usersService = inject(UsersService);
  private subjectsService = inject(SubjectsService);

  langOptions = LANG_OPTIONS;
  teachers: UserDto[] = [];
  classLevels: ClassLevelDto[] = [];
  loading = false;

  // Form with validation
  form = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(3)]],
    classLevel: [null as number | null, [Validators.required]],
    langType: ['kaz', [Validators.required]],
    classTeacherId: ['']
  });

  ngOnInit(): void {
    this.loadTeachers();
    this.loadClassLevels();
  }

  /**
   * Load list of teachers (users with TEACHER role)
   */
  loadTeachers(): void {
    this.usersService.listTeachersAll().subscribe({
      next: (users) => {
        this.teachers = users;
      },
      error: () => {
        // Error handled by interceptor
        this.teachers = [];
      }
    });
  }

  /**
   * Load list of class levels for dropdown
   */
  loadClassLevels(): void {
    this.subjectsService.getClassLevels().subscribe({
      next: (levels) => {
        this.classLevels = levels;
      },
      error: () => {
        // Error handled by interceptor
        this.classLevels = [];
      }
    });
  }

  /**
   * Submit form and create class
   */
  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    const body = this.form.value as unknown as CreateClassBody;

    // Convert empty classTeacherId to null
    if (body.classTeacherId === '') {
      (body as any).classTeacherId = null;
    }

    this.api.create(body).subscribe({
      next: (classItem) => {
        this.loading = false;
        this.dialogRef.close(classItem); // Return created class to caller
      },
      error: () => {
        this.loading = false;
        // Error notification shown automatically by error interceptor
      }
    });
  }

  /**
   * Close dialog without creating class
   */
  close(): void {
    this.dialogRef.close();
  }
}
