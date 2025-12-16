import { Component, inject, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UsersService, UserDto, UpdateUserBody } from '../users.service';
import { ClassesService, ClassDto } from '../../classes/classes.service';
import { UploadAvatarComponent } from '../../../shared/components/upload-avatar/upload-avatar.component';

const ROLE_OPTIONS = [
  'STUDENT',
  'PARENT',
  'TEACHER',
  'ADMIN',
  'ADMIN_SCHEDULE',
  'ADMIN_ASSESSMENT',
  'SUPER_ADMIN'
];

@Component({
  standalone: true,
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
    UploadAvatarComponent
  ]
})
export class UserEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<UserEditComponent>);
  private api = inject(UsersService);
  private classesApi = inject(ClassesService);
  private snackBar = inject(MatSnackBar);

  roles = ROLE_OPTIONS;
  loading = false;
  form!: FormGroup;
  classes: ClassDto[] = [];

  constructor(@Inject(MAT_DIALOG_DATA) public data: UserDto) {
    // Form with validation, pre-filled with existing user data
    // Only editable fields: fullName, role, status, dateOfBirth, photoKey, photoMediaId, classId (for students)
    this.form = this.fb.group({
      fullName: [data.fullName, [Validators.required, Validators.minLength(2)]],
      role: [data.role, [Validators.required]],
      status: [data.status, [Validators.required]],
      dateOfBirth: [data.dateOfBirth || ''],
      photoKey: [data.photoKey || ''],  // S3 key for avatar photo (for display)
      photoMediaId: [''],  // UUID of MediaObject for avatar photo (for update)
      classId: [data.classDto?.id || '']
    });
  }

  ngOnInit(): void {
    // Load classes for student selection
    this.classesApi.listAll().subscribe({
      next: (classes) => {
        this.classes = classes;
      },
      error: (err) => {
        console.error('Error loading classes:', err);
        this.classes = [];
      }
    });

    // Set initial validation based on current role
    const classIdControl = this.form.get('classId');
    if (this.data.role === 'STUDENT') {
      classIdControl?.setValidators([Validators.required]);
    }

    // Watch role changes to add/remove validation on classId
    this.form.get('role')?.valueChanges.subscribe((role) => {
      if (role === 'STUDENT') {
        classIdControl?.setValidators([Validators.required]);
      } else {
        classIdControl?.clearValidators();
        classIdControl?.setValue('');
      }
      classIdControl?.updateValueAndValidity();
    });
  }

  /**
   * Check if current role is STUDENT
   */
  isStudent(): boolean {
    return this.form.get('role')?.value === 'STUDENT';
  }

  /**
   * Handle successful avatar upload
   */
  onAvatarUploaded(result: { s3Key: string; mediaObjectId: string }): void {
    this.form.patchValue({
      photoKey: result.s3Key,
      photoMediaId: result.mediaObjectId
    });
    this.snackBar.open('Аватар успешно загружен', 'OK', { duration: 3000 });
  }

  /**
   * Handle avatar upload error
   */
  onAvatarError(error: string): void {
    this.snackBar.open(`Ошибка загрузки: ${error}`, 'OK', { duration: 5000 });
  }

  /**
   * Submit form and update user
   */
  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    const formValue = this.form.value;
    const body: UpdateUserBody = {
      fullName: formValue.fullName,
      role: formValue.role,
      status: formValue.status
    };

    // Only include dateOfBirth if it's set
    if (formValue.dateOfBirth) {
      body.dateOfBirth = formValue.dateOfBirth;
    }

    // Include photoMediaId if it's set (new uploads)
    if (formValue.photoMediaId) {
      body.photoMediaId = formValue.photoMediaId;
    }

    // Only include classId if it's set (for students)
    if (formValue.classId) {
      body.classId = formValue.classId;
    }

    this.api.update(this.data.id, body).subscribe({
      next: (user) => {
        this.loading = false;
        this.dialogRef.close(user); // Return updated user to caller
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
