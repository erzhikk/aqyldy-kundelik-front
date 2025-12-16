import { Component, inject, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ClassesService, ClassDto, UpdateClassBody } from '../classes.service';
import { UsersService, UserDto } from '../../users/users.service';

const LANG_OPTIONS = ['kaz', 'rus', 'eng'];

@Component({
  standalone: true,
  selector: 'app-class-edit',
  templateUrl: './class-edit.component.html',
  styleUrls: ['./class-edit.component.scss'],
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
export class ClassEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ClassEditComponent>);
  private api = inject(ClassesService);
  private usersService = inject(UsersService);

  langOptions = LANG_OPTIONS;
  teachers: UserDto[] = [];
  loading = false;
  form!: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: ClassDto) {
    // Form with validation, pre-filled with existing class data
    // Only editable fields: code, langType, classTeacherId
    this.form = this.fb.group({
      code: [data.code, [Validators.required, Validators.maxLength(3)]],
      langType: [data.langType, [Validators.required]],
      classTeacherId: [data.classTeacherId || '']
    });
  }

  ngOnInit(): void {
    this.loadTeachers();
  }

  /**
   * Load list of teachers (users with TEACHER role)
   */
  loadTeachers(): void {
    this.usersService.list().subscribe({
      next: (users) => {
        this.teachers = users.filter(u => u.role === 'TEACHER' && u.isActive);
      },
      error: () => {
        // Error handled by interceptor
        this.teachers = [];
      }
    });
  }

  /**
   * Submit form and update class
   */
  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    const body = this.form.value as UpdateClassBody;

    // Convert empty classTeacherId to null
    if (body.classTeacherId === '') {
      (body as any).classTeacherId = null;
    }

    this.api.update(this.data.id, body).subscribe({
      next: (classItem) => {
        this.loading = false;
        this.dialogRef.close(classItem); // Return updated class to caller
      },
      error: () => {
        this.loading = false;
        // Error notification shown automatically by error interceptor
      }
    });
  }

  /**
   * Close dialog without saving
   */
  close(): void {
    this.dialogRef.close();
  }
}
