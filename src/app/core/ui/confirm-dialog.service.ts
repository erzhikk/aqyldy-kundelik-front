import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);

  /**
   * Open a confirmation dialog
   * @param data Dialog configuration
   * @returns Observable<boolean> - true if confirmed, false if cancelled/closed
   */
  confirm(data: ConfirmDialogData): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data,
      disableClose: false,
      autoFocus: true,
      hasBackdrop: true,
      backdropClass: 'confirm-dialog-backdrop'
    });

    return new Observable<boolean>(observer => {
      dialogRef.afterClosed().subscribe(result => {
        observer.next(result === true);
        observer.complete();
      });
    });
  }

  /**
   * Shorthand for a simple confirmation
   */
  confirmAction(title: string, message: string): Observable<boolean> {
    return this.confirm({
      title,
      message,
      confirmText: 'OK',
      cancelText: this.translate.instant('COMMON.CANCEL'),
      confirmColor: 'primary'
    });
  }

  /**
   * Confirmation for delete actions
   */
  confirmDelete(message: string): Observable<boolean> {
    return this.confirm({
      title: this.translate.instant('CONFIRM.DELETE_TITLE'),
      message,
      confirmText: this.translate.instant('CONFIRM.DELETE_CONFIRM'),
      cancelText: this.translate.instant('COMMON.CANCEL'),
      confirmColor: 'warn',
      icon: 'warning'
    });
  }

  /**
   * Confirmation for publish actions
   */
  confirmPublish(message: string): Observable<boolean> {
    return this.confirm({
      title: this.translate.instant('CONFIRM.PUBLISH_TITLE'),
      message,
      confirmText: this.translate.instant('CONFIRM.PUBLISH_CONFIRM'),
      cancelText: this.translate.instant('COMMON.CANCEL'),
      confirmColor: 'accent',
      icon: 'info'
    });
  }
}
