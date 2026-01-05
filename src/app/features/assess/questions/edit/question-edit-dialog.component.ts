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
import { QuestionsService, QuestionDto, QuestionDifficulty, UpdateQuestionBody } from '../questions.service';

export interface QuestionEditDialogData {
  question: QuestionDto;
  topicName: string;
}

@Component({
  standalone: true,
  selector: 'app-question-edit-dialog',
  templateUrl: './question-edit-dialog.component.html',
  styleUrls: ['./question-edit-dialog.component.scss'],
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
export class QuestionEditDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<QuestionEditDialogComponent>);
  private api = inject(QuestionsService);

  loading = false;
  difficulties: QuestionDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];

  form: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: QuestionEditDialogData) {
    const question = data.question;
    const correctIndex = Math.max(question.choices.findIndex(choice => choice.isCorrect), 0);

    this.form = this.fb.group({
      text: [question.text, [Validators.required, Validators.minLength(2)]],
      explanation: [question.explanation || ''],
      difficulty: [question.difficulty || 'MEDIUM', Validators.required],
      correctIndex: [correctIndex, Validators.required],
      choices: this.fb.array([])
    });

    const sortedChoices = [...question.choices].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    sortedChoices.forEach(choice => {
      this.choices.push(this.fb.group({
        text: [choice.text, Validators.required]
      }));
    });

    while (this.choices.length < 4) {
      this.addChoice();
    }
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

    const body: UpdateQuestionBody = {
      topicId: this.data.question.topicId,
      text: this.form.value.text,
      explanation: this.form.value.explanation || null,
      difficulty: this.form.value.difficulty,
      choices: this.choices.controls.map((choice, index) => ({
        text: choice.value.text,
        isCorrect: index === correctIndex,
        order: index + 1
      }))
    };

    this.api.update(this.data.question.id, body).subscribe({
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
