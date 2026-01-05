import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { QuestionsService, CreateQuestionBody, QuestionDifficulty } from '../questions.service';

export interface QuestionCreateDialogData {
  topicId: string;
  topicName: string;
}

@Component({
  standalone: true,
  selector: 'app-question-create-dialog',
  templateUrl: './question-create-dialog.component.html',
  styleUrls: ['./question-create-dialog.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ]
})
export class QuestionCreateDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<QuestionCreateDialogComponent>);
  private api = inject(QuestionsService);

  loading = false;
  difficulties: QuestionDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];

  form: FormGroup = this.fb.group({
    text: ['', [Validators.required, Validators.minLength(2)]],
    explanation: [''],
    difficulty: ['MEDIUM', Validators.required],
    correctIndex: [null, Validators.required],
    choices: this.fb.array([])
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: QuestionCreateDialogData) {
    this.addChoice();
    this.addChoice();
    this.addChoice();
    this.addChoice();
  }

  get choices(): FormArray {
    return this.form.get('choices') as FormArray;
  }

  addChoice(): void {
    if (this.choices.length >= 5) return;
    this.choices.push(this.fb.group({
      text: ['', Validators.required]
    }));
  }

  removeChoice(index: number): void {
    if (this.choices.length <= 4) return;
    this.choices.removeAt(index);
    const correctIndex = this.form.get('correctIndex')?.value;
    if (correctIndex === index) {
      this.form.get('correctIndex')?.setValue(null);
    } else if (correctIndex > index) {
      this.form.get('correctIndex')?.setValue(correctIndex - 1);
    }
  }

  submit(): void {
    if (this.form.invalid || this.choices.length < 4) {
      this.form.markAllAsTouched();
      return;
    }

    const correctIndex = this.form.get('correctIndex')?.value;
    if (correctIndex === null || correctIndex === undefined) {
      this.form.get('correctIndex')?.markAsTouched();
      return;
    }

    this.loading = true;

    const body: CreateQuestionBody = {
      topicId: this.data.topicId,
      text: this.form.value.text,
      explanation: this.form.value.explanation || null,
      difficulty: this.form.value.difficulty,
      choices: this.choices.controls.map((choice, index) => ({
        text: choice.value.text,
        isCorrect: index === correctIndex,
        order: index + 1
      }))
    };

    this.api.create(body).subscribe({
      next: (question) => {
        this.loading = false;
        this.dialogRef.close(question);
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
