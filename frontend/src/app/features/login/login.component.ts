import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { AuthApiService } from '../../core/services/auth-api.service';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatIconModule
    ],
    template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-icon class="logo-icon">local_hospital</mat-icon>
          <mat-card-title>Patient Management</mat-card-title>
          <mat-card-subtitle>Sign in to your account</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email"
                     placeholder="admin@example.com" autocomplete="email" />
              <mat-icon matPrefix>email</mat-icon>
              <mat-error *ngIf="form.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="form.get('email')?.hasError('email')">
                Please enter a valid email address
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput [type]="hidePassword ? 'password' : 'text'"
                     formControlName="password" autocomplete="current-password" />
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button"
                      (click)="hidePassword = !hidePassword">
                <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="form.get('password')?.hasError('required')">
                Password is required
              </mat-error>
              <mat-error *ngIf="form.get('password')?.hasError('minlength')">
                Password must be at least 8 characters
              </mat-error>
            </mat-form-field>

            <!-- API-level error (e.g. 401 wrong credentials) -->
            <div *ngIf="apiError" class="api-error">
              <mat-icon>error_outline</mat-icon>
              {{ apiError }}
            </div>

            <button mat-flat-button color="primary" type="submit"
                    class="full-width submit-btn" [disabled]="loading">
              <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
              <span *ngIf="!loading">Sign In</span>
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
    styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a237e 0%, #0288d1 100%);
    }
    .login-card {
      width: 100%;
      max-width: 420px;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.25);
    }
    mat-card-header {
      flex-direction: column;
      align-items: center;
      margin-bottom: 24px;
      text-align: center;
    }
    .logo-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #1a237e;
      margin-bottom: 8px;
    }
    .full-width { width: 100%; }
    .submit-btn {
      margin-top: 12px;
      height: 48px;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .api-error {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #c62828;
      font-size: 14px;
      margin: 8px 0;
    }
  `]
})
export class LoginComponent {
    form = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]]
    });

    loading = false;
    apiError: string | null = null;
    hidePassword = true;

    constructor(
        private fb: FormBuilder,
        private authApi: AuthApiService,
        private authState: AuthStateService,
        private router: Router
    ) {
        // Redirect if already logged in
        if (this.authState.isLoggedIn()) {
            this.router.navigate(['/patients']);
        }
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading = true;
        this.apiError = null;

        const { email, password } = this.form.getRawValue();
        this.authApi.login({ email: email!, password: password! }).subscribe({
            next: (res) => {
                this.authState.setToken(res.token);
                this.router.navigate(['/patients']);
            },
            error: (err: HttpErrorResponse) => {
                this.loading = false;
                if (err.status === 401) {
                    this.apiError = 'Invalid email or password. Please try again.';
                } else if (err.error?.message) {
                    this.apiError = err.error.message;
                } else {
                    this.apiError = 'Login failed. Please check the server is running.';
                }
            }
        });
    }
}
