import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
  icon?: 'info' | 'warning' | 'error' | 'help';
}

@Component({
  standalone: true,
  selector: 'app-confirm-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <h2 mat-dialog-title>
        <mat-icon
          class="dialog-icon"
          [ngClass]="{
            'icon-info': data.icon === 'info' || !data.icon,
            'icon-warning': data.icon === 'warning',
            'icon-error': data.icon === 'error',
            'icon-help': data.icon === 'help'
          }"
        >
          {{ getIcon() }}
        </mat-icon>
        {{ data.title }}
      </h2>
      <mat-dialog-content>
        <p [innerHTML]="data.message"></p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">
          {{ data.cancelText || 'Отмена' }}
        </button>
        <button
          mat-raised-button
          [color]="data.confirmColor || 'primary'"
          (click)="onConfirm()"
          cdkFocusInitial
        >
          {{ data.confirmText || 'OK' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      min-width: 400px;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      color: #0f172a;
      font-size: 20px;
      font-weight: 600;
    }

    .dialog-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .icon-info {
      color: #0ea5a4;
    }

    .icon-warning {
      color: #f59e0b;
    }

    .icon-error {
      color: #ef4444;
    }

    .icon-help {
      color: #3b82f6;
    }

    mat-dialog-content {
      padding: 20px 24px;
      color: #475569;
      font-size: 15px;
      line-height: 1.6;
    }

    mat-dialog-content p {
      margin: 0;
    }

    mat-dialog-actions {
      padding: 16px 24px;
      gap: 12px;
    }

    button {
      min-width: 100px;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  getIcon(): string {
    switch (this.data.icon) {
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'help':
        return 'help';
      case 'info':
      default:
        return 'info';
    }
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
