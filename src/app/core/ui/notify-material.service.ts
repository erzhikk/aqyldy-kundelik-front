import { Injectable } from '@angular/core';
// import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Material Notification Service
 *
 * REQUIRES: @angular/material
 * Install: ng add @angular/material
 *
 * Usage:
 *   notify.success('Operation completed')
 *   notify.error('Something went wrong', 5000)
 */
@Injectable({ providedIn: 'root' })
export class NotifyMaterialService {
  // Uncomment after installing @angular/material:
  // constructor(private snack: MatSnackBar) {}

  // success(msg: string, ms = 3000): void {
  //   this.snack.open(msg, 'OK', {
  //     duration: ms,
  //     panelClass: ['snack-success'],
  //     horizontalPosition: 'center',
  //     verticalPosition: 'bottom'
  //   });
  // }

  // error(msg: string, ms = 5000): void {
  //   this.snack.open(msg, 'Close', {
  //     duration: ms,
  //     panelClass: ['snack-error'],
  //     horizontalPosition: 'center',
  //     verticalPosition: 'bottom'
  //   });
  // }

  // info(msg: string, ms = 3000): void {
  //   this.snack.open(msg, 'OK', {
  //     duration: ms,
  //     panelClass: ['snack-info'],
  //     horizontalPosition: 'center',
  //     verticalPosition: 'bottom'
  //   });
  // }

  // warning(msg: string, ms = 4000): void {
  //   this.snack.open(msg, 'OK', {
  //     duration: ms,
  //     panelClass: ['snack-warning'],
  //     horizontalPosition: 'center',
  //     verticalPosition: 'bottom'
  //   });
  // }
}

/**
 * Installation Steps:
 *
 * 1. Install Angular Material:
 *    ng add @angular/material
 *
 * 2. Import MatSnackBarModule in app.config.ts:
 *    import { importProvidersFrom } from '@angular/core';
 *    import { MatSnackBarModule } from '@angular/material/snack-bar';
 *
 *    providers: [
 *      importProvidersFrom(MatSnackBarModule),
 *      ...
 *    ]
 *
 * 3. Add styles to styles.css:
 *    .snack-success { background: #16a34a !important; color: #fff !important; }
 *    .snack-error { background: #dc2626 !important; color: #fff !important; }
 *    .snack-info { background: #2563eb !important; color: #fff !important; }
 *    .snack-warning { background: #ea580c !important; color: #fff !important; }
 *
 * 4. Uncomment the code above
 */
