import { Component, inject, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { SubjectsService, SubjectDto, UpdateSubjectBody, ClassLevelDto } from '../subjects.service';

@Component({
  standalone: true,
  selector: 'app-subject-edit',
  templateUrl: './subject-edit.component.html',
  styleUrls: ['./subject-edit.component.scss'],
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
export class SubjectEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<SubjectEditComponent>);
  private api = inject(SubjectsService);

  classLevels: ClassLevelDto[] = [];
  loading = false;
  form!: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: SubjectDto) {
    // Form with validation, pre-filled with existing subject data
    // Only editable fields: nameRu, nameKk, nameEn, classLevelId
    this.form = this.fb.group({
      nameRu: [data.nameRu, [Validators.required, Validators.minLength(2)]],
      nameKk: [data.nameKk, [Validators.required, Validators.minLength(2)]],
      nameEn: [data.nameEn, [Validators.required, Validators.minLength(2)]],
      classLevelId: [data.classLevel.id, [Validators.required]]
    });
  }

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
   * Submit form and update subject
   */
  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    const body = this.form.value as UpdateSubjectBody;

    this.api.update(this.data.id, body).subscribe({
      next: (subject) => {
        this.loading = false;
        this.dialogRef.close(subject); // Return updated subject to caller
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
