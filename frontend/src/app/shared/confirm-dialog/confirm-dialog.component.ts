import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

export interface ConfirmDialogData {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
}

/**
 * Reusable confirmation dialog (used for delete patient).
 * Usage:
 *   const ref = this.dialog.open(ConfirmDialogComponent, {
 *     data: { title: 'Delete Patient', message: 'Are you sure?' }
 *   });
 *   ref.afterClosed().subscribe(confirmed => { if (confirmed) { ... } });
 */
@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule],
    template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">
        {{ data.cancelLabel || 'Cancel' }}
      </button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true">
        {{ data.confirmLabel || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<ConfirmDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
    ) { }
}
