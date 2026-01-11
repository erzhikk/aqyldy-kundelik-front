import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UsersService, CreateUserBody } from '../users.service';
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
  selector: 'app-user-create',
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.scss'],
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
export class UserCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<UserCreateComponent>);
  private api = inject(UsersService);
  private classesApi = inject(ClassesService);
  private snackBar = inject(MatSnackBar);

  roles = ROLE_OPTIONS;
  loading = false;
  classes: ClassDto[] = [];

  // Temporary user ID for avatar upload (before user is created)
  // In production, you might want to generate a more unique ID
  temporaryUserId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Form with validation
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    role: ['TEACHER', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    dateOfBirth: [''],
    classId: ['']
  });

  avatarFile: File | null = null;

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

    // Watch role changes to add/remove validation on classId
    this.form.get('role')?.valueChanges.subscribe((role) => {
      const classIdControl = this.form.get('classId');
      if (role === 'STUDENT') {
        classIdControl?.setValidators([Validators.required]);
      } else {
        classIdControl?.clearValidators();
        classIdControl?.setValue('');
      }
      classIdControl?.updateValueAndValidity();
    });
  }

  onAvatarSelected(file: File): void {
    this.avatarFile = file;
  }

  onAvatarCleared(): void {
    this.avatarFile = null;
  }

  isStudent(): boolean {
    return this.form.get('role')?.value === 'STUDENT';
  }

  /**
   * Submit form and create user
   */
  submit(): void {
    if (this.form.invalid) return;
    if (!this.avatarFile) {
      this.snackBar.open('Select an avatar image before creating the user', 'OK', { duration: 4000 });
      return;
    }

    this.loading = true;
    const formValue = this.form.value;
    const body: CreateUserBody = {
      email: formValue.email!,
      fullName: formValue.fullName!,
      role: formValue.role!,
      password: formValue.password!
    };

    // Only include dateOfBirth if it's set
    if (formValue.dateOfBirth) {
      body.dateOfBirth = formValue.dateOfBirth;
    }

    // Only include classId if it's set (for students)
    if (formValue.classId) {
      body.classId = formValue.classId;
    }

    this.api.create(body, this.avatarFile).subscribe({
      next: (user) => {
        this.loading = false;
        this.dialogRef.close(user); // Return created user to caller
      },
      error: (error) => {
        this.loading = false;
        const message = error?.error?.message || 'Failed to create user';
        this.snackBar.open(message, 'OK', { duration: 5000 });
      }
    });
  }

  /**
   * Close dialog without creating user
   */
  close(): void {
    this.dialogRef.close();
  }
}
