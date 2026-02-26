import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { PatientApiService } from '../../core/services/patient-api.service';
import { BackendError } from '../../core/models/patient.model';

/** ISO date pattern: YYYY-MM-DD */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

@Component({
    selector: 'app-patient-create',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatToolbarModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSnackBarModule
    ],
    template: `
    <mat-toolbar color="primary" class="toolbar">
      <button mat-icon-button routerLink="/patients">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <span>New Patient</span>
    </mat-toolbar>

    <div class="page-content">
      <mat-card class="form-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>person_add</mat-icon>
          <mat-card-title>Create Patient</mat-card-title>
          <mat-card-subtitle>Fill out all required fields</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

            <!-- Name -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Full Name</mat-label>
              <input matInput formControlName="name" placeholder="Alice Johnson" />
              <mat-icon matPrefix>person</mat-icon>
              <mat-error *ngIf="f['name'].hasError('required')">Name is required</mat-error>
              <mat-error *ngIf="f['name'].hasError('maxlength')">Maximum 100 characters</mat-error>
              <mat-error *ngIf="f['name'].hasError('serverError')">
                {{ f['name'].getError('serverError') }}
              </mat-error>
            </mat-form-field>

            <!-- Email -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email"
                     placeholder="alice@example.com" />
              <mat-icon matPrefix>email</mat-icon>
              <mat-error *ngIf="f['email'].hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="f['email'].hasError('email')">
                Please enter a valid email address
              </mat-error>
              <mat-error *ngIf="f['email'].hasError('serverError')">
                {{ f['email'].getError('serverError') }}
              </mat-error>
            </mat-form-field>

            <!-- Address -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Address</mat-label>
              <textarea matInput formControlName="address" rows="2"
                        placeholder="123 Main Street, City, State"></textarea>
              <mat-icon matPrefix>home</mat-icon>
              <mat-error *ngIf="f['address'].hasError('required')">Address is required</mat-error>
              <mat-error *ngIf="f['address'].hasError('maxlength')">Maximum 255 characters</mat-error>
              <mat-error *ngIf="f['address'].hasError('serverError')">
                {{ f['address'].getError('serverError') }}
              </mat-error>
            </mat-form-field>

            <!-- Date of Birth -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Date of Birth</mat-label>
              <input
                matInput
                [matDatepicker]="dobPicker"
                formControlName="dateOfBirth"
                [max]="today"
              />
              <mat-datepicker-toggle matSuffix [for]="dobPicker"></mat-datepicker-toggle>
              <mat-datepicker #dobPicker></mat-datepicker>
              <mat-icon matPrefix>cake</mat-icon>
              <mat-error *ngIf="f['dateOfBirth'].hasError('required')">
                Date of birth is required
              </mat-error>
              <mat-error *ngIf="f['dateOfBirth'].hasError('serverError')">
                {{ f['dateOfBirth'].getError('serverError') }}
              </mat-error>
            </mat-form-field>

            <!-- Registered Date -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Registered Date</mat-label>
              <input
                matInput
                [matDatepicker]="regPicker"
                formControlName="registeredDate"
                [max]="today"
              />
              <mat-datepicker-toggle matSuffix [for]="regPicker"></mat-datepicker-toggle>
              <mat-datepicker #regPicker></mat-datepicker>
              <mat-icon matPrefix>event</mat-icon>
              <mat-error *ngIf="f['registeredDate'].hasError('required')">
                Registered date is required
              </mat-error>
              <mat-error *ngIf="f['registeredDate'].hasError('serverError')">
                {{ f['registeredDate'].getError('serverError') }}
              </mat-error>
            </mat-form-field>

            <!-- General API error -->
            <div *ngIf="apiError" class="api-error">
              <mat-icon>error_outline</mat-icon>
              {{ apiError }}
            </div>

            <!-- Actions -->
            <div class="form-actions">
              <button mat-stroked-button type="button" routerLink="/patients">
                Cancel
              </button>
              <button mat-flat-button color="primary" type="submit" [disabled]="loading">
                <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
                <span *ngIf="!loading">Create Patient</span>
              </button>
            </div>

          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
    styles: [`
    .toolbar { position: sticky; top: 0; z-index: 100; }
    .page-content { padding: 24px; max-width: 720px; margin: 0 auto; }
    .form-card { border-radius: 12px; padding: 8px; }
    .full-width { width: 100%; margin-bottom: 8px; }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 16px;
    }
    .api-error {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #c62828;
      font-size: 14px;
      margin-bottom: 12px;
    }
  `]
})
export class PatientCreateComponent {
    form = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(100)]],
        email: ['', [Validators.required, Validators.email]],
        address: ['', [Validators.required, Validators.maxLength(255)]],
        dateOfBirth: [null as Date | null, [Validators.required]],
        registeredDate: [new Date() as Date | null, [Validators.required]]
    });

    loading = false;
    apiError: string | null = null;
    readonly today = new Date();

    /** Convenience getter for form controls */
    get f(): { [key: string]: AbstractControl } {
        return this.form.controls;
    }

    constructor(
        private fb: FormBuilder,
        private patientApi: PatientApiService,
        private router: Router,
        private snackBar: MatSnackBar
    ) { }

    private formatDate(value: Date | string | null | undefined): string {
        if (!value) {
            return '';
        }
        if (typeof value === 'string') {
            return value;
        }
        // Format as YYYY-MM-DD for backend
        return value.toISOString().slice(0, 10);
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading = true;
        this.apiError = null;

        const val = this.form.getRawValue();
        this.patientApi.create({
            name: val.name!,
            email: val.email!,
            address: val.address!,
            dateOfBirth: this.formatDate(val.dateOfBirth),
            registeredDate: this.formatDate(val.registeredDate)
        }).subscribe({
            next: (created) => {
                this.snackBar.open('Patient created successfully!', 'Close', { duration: 3000 });
                this.router.navigate(['/patients', created.id]);
            },
            error: (err: HttpErrorResponse) => {
                this.loading = false;
                const body = err.error as BackendError | undefined;

                // Map field-level errors from backend back onto form controls
                const fieldErrors = body?.details?.fieldErrors;
                if (fieldErrors) {
                    Object.entries(fieldErrors).forEach(([field, message]) => {
                        const ctrl = this.form.get(field);
                        if (ctrl) {
                            ctrl.setErrors({ ...ctrl.errors, serverError: message });
                        }
                    });
                }

                this.apiError = body?.message ?? 'Failed to create patient. Please try again.';
            }
        });
    }
}
