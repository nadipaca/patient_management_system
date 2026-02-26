import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
    ReactiveFormsModule,
    FormBuilder,
    Validators,
    AbstractControl
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';

import { PatientApiService } from '../../core/services/patient-api.service';
import { PatientResponse, BackendError } from '../../core/models/patient.model';
import {
    ConfirmDialogComponent,
    ConfirmDialogData
} from '../../shared/confirm-dialog/confirm-dialog.component';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

@Component({
    selector: 'app-patient-detail',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,
        MatToolbarModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatDividerModule,
        MatDialogModule,
        MatSnackBarModule,
        MatChipsModule
    ],
    template: `
    <mat-toolbar color="primary" class="toolbar">
      <button mat-icon-button routerLink="/patients">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <span>Patient Detail</span>
      <span class="spacer"></span>
      <button *ngIf="patient && !editMode" mat-icon-button color="accent"
              matTooltip="Edit" (click)="enterEditMode()">
        <mat-icon>edit</mat-icon>
      </button>
      <button *ngIf="patient && !editMode" mat-icon-button color="warn"
              matTooltip="Delete" (click)="confirmDelete()">
        <mat-icon>delete</mat-icon>
      </button>
    </mat-toolbar>

    <div class="page-content">

      <!-- Loading -->
      <div *ngIf="loading" class="state-container">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Loading…</p>
      </div>

      <!-- Error: Patient not found -->
      <div *ngIf="error && !loading" class="state-container error-state">
        <mat-icon class="state-icon">error_outline</mat-icon>
        <p>{{ error }}</p>
        <button mat-stroked-button routerLink="/patients">
          <mat-icon>arrow_back</mat-icon> Back to list
        </button>
      </div>

      <!-- View Mode -->
      <mat-card *ngIf="patient && !editMode && !loading" class="detail-card">
        <mat-card-header>
          <div class="avatar-large">{{ patient.name[0].toUpperCase() }}</div>
          <div class="header-text">
            <mat-card-title>{{ patient.name }}</mat-card-title>
            <mat-card-subtitle>{{ patient.email }}</mat-card-subtitle>
          </div>
        </mat-card-header>

        <mat-card-content class="detail-content">
          <mat-divider></mat-divider>
          <dl class="detail-list">
            <div class="detail-row">
              <dt><mat-icon>badge</mat-icon> ID</dt>
              <dd class="id-value">{{ patient.id }}</dd>
            </div>
            <div class="detail-row">
              <dt><mat-icon>home</mat-icon> Address</dt>
              <dd>{{ patient.address }}</dd>
            </div>
            <div class="detail-row">
              <dt><mat-icon>cake</mat-icon> Date of Birth</dt>
              <dd>{{ patient.dateOfBirth }}</dd>
            </div>
          </dl>
        </mat-card-content>

        <mat-card-actions>
          <button mat-flat-button color="primary" (click)="enterEditMode()">
            <mat-icon>edit</mat-icon> Edit Patient
          </button>
          <button mat-stroked-button color="warn" (click)="confirmDelete()">
            <mat-icon>delete</mat-icon> Delete
          </button>
        </mat-card-actions>
      </mat-card>

      <!-- Edit Mode -->
      <mat-card *ngIf="patient && editMode && !loading" class="detail-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>edit</mat-icon>
          <mat-card-title>Edit Patient</mat-card-title>
          <mat-card-subtitle>{{ patient.id }}</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="editForm" (ngSubmit)="onSave()" novalidate>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Full Name</mat-label>
              <input matInput formControlName="name" />
              <mat-icon matPrefix>person</mat-icon>
              <mat-error *ngIf="ef['name'].hasError('required')">Name is required</mat-error>
              <mat-error *ngIf="ef['name'].hasError('maxlength')">Maximum 100 characters</mat-error>
              <mat-error *ngIf="ef['name'].hasError('serverError')">
                {{ ef['name'].getError('serverError') }}
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" />
              <mat-icon matPrefix>email</mat-icon>
              <mat-error *ngIf="ef['email'].hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="ef['email'].hasError('email')">
                Valid email required
              </mat-error>
              <mat-error *ngIf="ef['email'].hasError('serverError')">
                {{ ef['email'].getError('serverError') }}
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Address</mat-label>
              <textarea matInput formControlName="address" rows="2"></textarea>
              <mat-icon matPrefix>home</mat-icon>
              <mat-error *ngIf="ef['address'].hasError('required')">Address is required</mat-error>
              <mat-error *ngIf="ef['address'].hasError('maxlength')">Maximum 255 characters</mat-error>
              <mat-error *ngIf="ef['address'].hasError('serverError')">
                {{ ef['address'].getError('serverError') }}
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Date of Birth</mat-label>
              <input matInput formControlName="dateOfBirth" placeholder="YYYY-MM-DD" />
              <mat-icon matPrefix>cake</mat-icon>
              <mat-hint>Format: YYYY-MM-DD</mat-hint>
              <mat-error *ngIf="ef['dateOfBirth'].hasError('required')">
                Date of birth is required
              </mat-error>
              <mat-error *ngIf="ef['dateOfBirth'].hasError('pattern')">
                Format must be YYYY-MM-DD
              </mat-error>
              <mat-error *ngIf="ef['dateOfBirth'].hasError('serverError')">
                {{ ef['dateOfBirth'].getError('serverError') }}
              </mat-error>
            </mat-form-field>

            <!-- General API error -->
            <div *ngIf="saveError" class="api-error">
              <mat-icon>error_outline</mat-icon>
              {{ saveError }}
            </div>

            <div class="form-actions">
              <button mat-stroked-button type="button" (click)="cancelEdit()">
                Cancel
              </button>
              <button mat-flat-button color="primary" type="submit"
                      [disabled]="saving">
                <mat-spinner *ngIf="saving" diameter="20"></mat-spinner>
                <span *ngIf="!saving">Save Changes</span>
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

    </div>
  `,
    styles: [`
    .toolbar { position: sticky; top: 0; z-index: 100; }
    .spacer { flex: 1 1 auto; }
    .page-content { padding: 24px; max-width: 720px; margin: 0 auto; }
    .detail-card { border-radius: 12px; padding: 8px; }

    mat-card-header { margin-bottom: 16px; display: flex; align-items: center; gap: 16px; }
    .avatar-large {
      width: 56px; height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1a237e, #0288d1);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .header-text { display: flex; flex-direction: column; }

    .detail-content { padding: 16px 0; }
    .detail-list { margin: 16px 0; }
    .detail-row {
      display: flex;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .detail-row:last-child { border-bottom: none; }
    dt {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 160px;
      color: #757575;
      font-size: 14px;
    }
    dd { margin: 0; font-size: 15px; }
    .id-value { font-family: monospace; font-size: 13px; color: #555; }

    mat-card-actions { padding: 8px 16px; display: flex; gap: 12px; }

    .state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 24px;
      gap: 16px;
      color: #757575;
    }
    .state-icon { font-size: 64px; width: 64px; height: 64px; opacity: 0.4; }
    .error-state { color: #b71c1c; }

    .full-width { width: 100%; margin-bottom: 8px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
    .api-error {
      display: flex; align-items: center;
      gap: 6px; color: #c62828; font-size: 14px; margin-bottom: 12px;
    }
  `]
})
export class PatientDetailComponent implements OnInit {
    patient: PatientResponse | null = null;
    editMode = false;
    loading = false;
    saving = false;
    error: string | null = null;
    saveError: string | null = null;

    editForm = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(100)]],
        email: ['', [Validators.required, Validators.email]],
        address: ['', [Validators.required, Validators.maxLength(255)]],
        dateOfBirth: ['', [Validators.required, Validators.pattern(ISO_DATE_PATTERN)]]
    });

    get ef(): { [key: string]: AbstractControl } {
        return this.editForm.controls;
    }

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private fb: FormBuilder,
        private patientApi: PatientApiService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            this.error = 'Invalid patient ID.';
            return;
        }
        this.loadPatient(id);
    }

    /**
     * NOTE: The backend has no GET /api/patients/:id endpoint.
     * We fetch the full list and find the patient client-side here.
     * TODO: Replace with a real GET /api/patients/:id call once the endpoint exists.
     */
    private loadPatient(id: string): void {
        this.loading = true;
        this.patientApi.getAll().subscribe({
            next: (patients) => {
                this.loading = false;
                this.patient = patients.find(p => p.id === id) ?? null;
                if (!this.patient) {
                    this.error = `Patient with id "${id}" not found.`;
                }
            },
            error: (err) => {
                this.loading = false;
                this.error = err.error?.message ?? 'Failed to load patient.';
            }
        });
    }

    enterEditMode(): void {
        if (!this.patient) return;
        this.editForm.setValue({
            name: this.patient.name,
            email: this.patient.email,
            address: this.patient.address,
            dateOfBirth: this.patient.dateOfBirth
        });
        this.saveError = null;
        this.editMode = true;
    }

    cancelEdit(): void {
        this.editMode = false;
        this.saveError = null;
    }

    onSave(): void {
        if (this.editForm.invalid) {
            this.editForm.markAllAsTouched();
            return;
        }
        if (!this.patient) return;

        this.saving = true;
        this.saveError = null;
        const val = this.editForm.getRawValue();

        this.patientApi.update(this.patient.id, {
            name: val.name!,
            email: val.email!,
            address: val.address!,
            dateOfBirth: val.dateOfBirth!
        }).subscribe({
            next: (updated) => {
                this.patient = updated;
                this.saving = false;
                this.editMode = false;
                this.snackBar.open('Patient updated successfully!', 'Close', { duration: 3000 });
            },
            error: (err: HttpErrorResponse) => {
                this.saving = false;
                const body = err.error as BackendError | undefined;

                const fieldErrors = body?.details?.fieldErrors;
                if (fieldErrors) {
                    Object.entries(fieldErrors).forEach(([field, message]) => {
                        const ctrl = this.editForm.get(field);
                        if (ctrl) ctrl.setErrors({ ...ctrl.errors, serverError: message });
                    });
                }
                this.saveError = body?.message ?? 'Failed to save changes. Please try again.';
            }
        });
    }

    confirmDelete(): void {
        if (!this.patient) return;
        const data: ConfirmDialogData = {
            title: 'Delete Patient',
            message: `Delete "${this.patient.name}"? This action cannot be undone.`,
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel'
        };

        this.dialog.open(ConfirmDialogComponent, { data, width: '400px' })
            .afterClosed()
            .subscribe((confirmed: boolean) => {
                if (confirmed) {
                    this.deletePatient();
                }
            });
    }

    private deletePatient(): void {
        if (!this.patient) return;
        this.loading = true;
        this.patientApi.delete(this.patient.id).subscribe({
            next: () => {
                this.snackBar.open('Patient deleted.', 'Close', { duration: 3000 });
                this.router.navigate(['/patients']);
            },
            error: (err) => {
                this.loading = false;
                this.snackBar.open(
                    err.error?.message ?? 'Failed to delete patient.',
                    'Close',
                    { duration: 5000 }
                );
            }
        });
    }
}
