import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UsersService, CreateUserBody } from '../../users/users.service';
import { UploadAvatarComponent } from '../../../shared/components/upload-avatar/upload-avatar.component';

export type ClassStudentCreateData = {
  classId: string;
  classCode: string;
};

@Component({
  standalone: true,
  selector: 'app-class-student-create',
  templateUrl: './class-student-create.component.html',
  styleUrls: ['./class-student-create.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    UploadAvatarComponent
  ]
})
export class ClassStudentCreateComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ClassStudentCreateComponent>);
  private data = inject(MAT_DIALOG_DATA) as ClassStudentCreateData;
  private api = inject(UsersService);
  private snackBar = inject(MatSnackBar);

  loading = false;
  showPassword = false;
  temporaryUserId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  avatarFile: File | null = null;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    dateOfBirth: [''],
    role: [{ value: 'STUDENT', disabled: true }],
    classCode: [{ value: this.data.classCode, disabled: true }]
  });

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onAvatarSelected(file: File): void {
    this.avatarFile = file;
  }

  onAvatarCleared(): void {
    this.avatarFile = null;
  }

  submit(): void {
    if (this.form.invalid) return;
    if (!this.avatarFile) {
      this.snackBar.open('Select an avatar image before creating the student', 'OK', { duration: 4000 });
      return;
    }

    this.loading = true;
    const formValue = this.form.getRawValue();
    const body: CreateUserBody = {
      email: formValue.email!,
      fullName: formValue.fullName!,
      password: formValue.password!,
      role: 'STUDENT',
      classId: this.data.classId
    };

    if (formValue.dateOfBirth) {
      body.dateOfBirth = formValue.dateOfBirth;
    }
    this.api.create(body, this.avatarFile).subscribe({
      next: (student) => {
        this.loading = false;
        this.dialogRef.close(student);
      },
      error: (error) => {
        this.loading = false;
        const message = error?.error?.message || 'Failed to create student';
        this.snackBar.open(message, 'OK', { duration: 5000 });
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
