import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TopicsService, TopicDto, CreateTopicBody, UpdateTopicBody } from './topics.service';
import { TranslateModule } from '@ngx-translate/core';

export interface TopicDialogData {
  mode: 'create' | 'edit';
  subjectId: string;
  subjectName: string;
  topic?: TopicDto;
}

@Component({
  standalone: true,
  selector: 'app-topic-dialog',
  templateUrl: './topic-dialog.component.html',
  styleUrls: ['./topic-dialog.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TranslateModule
  ]
})
export class TopicDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<TopicDialogComponent>);
  private api = inject(TopicsService);

  loading = false;
  form!: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: TopicDialogData) {
    this.form = this.fb.group({
      name: [data.topic?.name || '', [Validators.required, Validators.minLength(2)]],
      description: [data.topic?.description || '']
    });
  }

  /**
   * Submit form and create/update topic
   */
  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;

    if (this.data.mode === 'create') {
      const body: CreateTopicBody = {
        subjectId: this.data.subjectId,
        name: this.form.value.name,
        description: this.form.value.description || null
      };

      this.api.createTopic(body).subscribe({
        next: (topic) => {
          this.loading = false;
          this.dialogRef.close(topic);
        },
        error: () => {
          this.loading = false;
        }
      });
    } else {
      const body: UpdateTopicBody = {
        name: this.form.value.name,
        description: this.form.value.description || null
      };

      this.api.updateTopic(this.data.topic!.id, body).subscribe({
        next: (topic) => {
          this.loading = false;
          this.dialogRef.close(topic);
        },
        error: () => {
          this.loading = false;
        }
      });
    }
  }

  /**
   * Close dialog without saving
   */
  close(): void {
    this.dialogRef.close();
  }
}
