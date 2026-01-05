import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { QuestionDto } from '../questions.service';

@Component({
  standalone: true,
  selector: 'app-question-view-dialog',
  templateUrl: './question-view-dialog.component.html',
  styleUrls: ['./question-view-dialog.component.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    TranslateModule
  ]
})
export class QuestionViewDialogComponent {
  displayedColumns = ['status', 'text'];

  constructor(
    public dialogRef: MatDialogRef<QuestionViewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { question: QuestionDto }
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}
