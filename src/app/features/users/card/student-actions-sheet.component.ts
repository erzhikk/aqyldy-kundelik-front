import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

/**
 * Data passed to the bottom sheet
 */
export interface StudentActionsData {
  studentId: string;
  hasPhoto: boolean;
}

/**
 * Action types that can be selected
 */
export type StudentAction = 'upload' | 'remove' | 'edit';

/**
 * Student Actions Bottom Sheet Component
 *
 * Mobile-friendly bottom sheet for student card actions:
 * - Upload photo
 * - Remove photo
 * - Edit student
 */
@Component({
  standalone: true,
  selector: 'app-student-actions-sheet',
  templateUrl: './student-actions-sheet.component.html',
  styleUrls: ['./student-actions-sheet.component.scss'],
  imports: [
    CommonModule,
    MatListModule,
    MatIconModule,
    MatDividerModule
  ]
})
export class StudentActionsSheetComponent {
  constructor(
    private bottomSheetRef: MatBottomSheetRef<StudentActionsSheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: StudentActionsData
  ) {}

  /**
   * Handle action selection
   */
  selectAction(action: StudentAction): void {
    this.bottomSheetRef.dismiss(action);
  }

  /**
   * Close bottom sheet without action
   */
  close(): void {
    this.bottomSheetRef.dismiss();
  }
}
