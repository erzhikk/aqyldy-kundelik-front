import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { SubjectsService, CreateSubjectBody, ClassLevelDto } from '../subjects.service';

@Component({
  standalone: true,
  selector: 'app-subject-create',
  templateUrl: './subject-create.component.html',
  styleUrls: ['./subject-create.component.scss'],
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
export class SubjectCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<SubjectCreateComponent>);
  private api = inject(SubjectsService);

  classLevels: ClassLevelDto[] = [];
  loading = false;

  // Form with validation
  form = this.fb.group({
    nameRu: ['', [Validators.required, Validators.minLength(2)]],
    nameKk: ['', [Validators.required, Validators.minLength(2)]],
    nameEn: ['', [Validators.required, Validators.minLength(2)]],
    classLevelId: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.loadClassLevels();
  }

  /**
   * Load class levels from API
   */
  loadClassLevels(): void {
    this.api.getClassLevels().subscribe({
      next: (levels) => {
        this.classLevels = levels;
      }
    });
  }

  /**
   * Submit form and create subject
   */
  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    const body = this.form.value as CreateSubjectBody;

    this.api.create(body).subscribe({
      next: (subject) => {
        this.loading = false;
        this.dialogRef.close(subject); // Return created subject to caller
      },
      error: () => {
        this.loading = false;
        // Error notification shown automatically by error interceptor
      }
    });
  }

  /**
   * Close dialog without creating subject
   */
  close(): void {
    this.dialogRef.close();
  }
}
