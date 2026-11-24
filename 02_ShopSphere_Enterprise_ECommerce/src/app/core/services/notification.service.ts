import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  success(message: string, action?: { label: string; link: string }): void {
    const ref = this.snackBar.open(message, action?.label ?? 'Dismiss', {
      duration: 3500,
      panelClass: 'snack-success',
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
    if (action) {
      ref.onAction().subscribe(() => this.router.navigateByUrl(action.link));
    }
  }

  error(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 6000,
      panelClass: 'snack-error',
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }

  info(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'bottom' });
  }
}
