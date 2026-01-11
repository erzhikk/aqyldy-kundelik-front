import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { TopicDto } from '../../topics/topics.service';

export interface AddTopicsDialogData {
  availableTopics: TopicDto[];
}

export interface AddTopicsDialogResult {
  selectedTopics: { topicId: string; topicName: string; targetCount: number }[];
}

@Component({
  standalone: true,
  selector: 'app-add-topics-dialog',
  templateUrl: './add-topics-dialog.component.html',
  styleUrls: ['./add-topics-dialog.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule
  ]
})
export class AddTopicsDialogComponent implements OnInit {
  topicsControl = new FormControl<string[]>([], [Validators.required]);
  targetCountControl = new FormControl<number>(5, [Validators.required, Validators.min(1), Validators.max(50)]);

  constructor(
    public dialogRef: MatDialogRef<AddTopicsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddTopicsDialogData
  ) {}

  ngOnInit(): void {
    if (!this.data.availableTopics || this.data.availableTopics.length === 0) {
      // No topics available, auto-close
      this.dialogRef.close();
    }
  }

  submit(): void {
    if (this.topicsControl.invalid || this.targetCountControl.invalid) {
      return;
    }

    const selectedTopicIds = this.topicsControl.value || [];
    const targetCount = this.targetCountControl.value || 5;

    const result: AddTopicsDialogResult = {
      selectedTopics: selectedTopicIds.map(topicId => {
        const topic = this.data.availableTopics.find(t => t.id === topicId);
        return {
          topicId,
          topicName: topic?.name || '',
          targetCount
        };
      })
    };

    this.dialogRef.close(result);
  }

  close(): void {
    this.dialogRef.close();
  }
}
