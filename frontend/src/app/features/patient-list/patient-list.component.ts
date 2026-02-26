import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

import { PatientApiService } from '../../core/services/patient-api.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { PatientResponse } from '../../core/models/patient.model';

@Component({
    selector: 'app-patient-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,
        MatTableModule,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatFormFieldModule,
        MatProgressSpinnerModule,
        MatPaginatorModule,
        MatTooltipModule,
        MatChipsModule
    ],
    template: `
    <!-- Top Toolbar -->
    <mat-toolbar color="primary" class="toolbar">
      <mat-icon class="toolbar-icon">local_hospital</mat-icon>
      <span class="toolbar-title">Patient Management</span>
      <span class="spacer"></span>
      <button mat-icon-button matTooltip="Logout" (click)="logout()">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>

    <div class="page-content">
      <!-- Header row: search + add button -->
      <div class="list-header">
        <h2 class="page-title">
          Patients
          <span class="count-chip" *ngIf="!loading">
            {{ filteredPatients.length }} total
          </span>
        </h2>

        <div class="header-actions">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search patients</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [formControl]="searchCtrl"
                   placeholder="Name, email or address…" />
            <button *ngIf="searchCtrl.value" matSuffix mat-icon-button
                    (click)="searchCtrl.setValue('')">
              <mat-icon>close</mat-icon>
            </button>
          </mat-form-field>

          <button mat-flat-button color="primary" routerLink="/patients/new">
            <mat-icon>add</mat-icon> New Patient
          </button>
        </div>
      </div>

      <!-- NOTE: Search and pagination are client-side.
           TODO: Replace with server-side ?search=&page=&size= params once
                 GET /api/patients supports query parameters. -->

      <!-- Loading state -->
      <div *ngIf="loading" class="state-container">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Loading patients…</p>
      </div>

      <!-- Error state -->
      <div *ngIf="error && !loading" class="state-container error-state">
        <mat-icon class="state-icon">error_outline</mat-icon>
        <p>{{ error }}</p>
        <button mat-stroked-button color="primary" (click)="loadPatients()">
          <mat-icon>refresh</mat-icon> Retry
        </button>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && !error && filteredPatients.length === 0" class="state-container">
        <mat-icon class="state-icon">people_outline</mat-icon>
        <p *ngIf="!searchCtrl.value">No patients yet. Create one to get started.</p>
        <p *ngIf="searchCtrl.value">No patients match "{{ searchCtrl.value }}".</p>
      </div>

      <!-- Data table -->
      <div *ngIf="!loading && !error && filteredPatients.length > 0" class="table-container">
        <table mat-table [dataSource]="pageData" class="patient-table">
          <!-- Name Column -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let p">
              <div class="name-cell">
                <div class="avatar">{{ p.name[0].toUpperCase() }}</div>
                {{ p.name }}
              </div>
            </td>
          </ng-container>

          <!-- Email Column -->
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let p">{{ p.email }}</td>
          </ng-container>

          <!-- Date of Birth Column -->
          <ng-container matColumnDef="dateOfBirth">
            <th mat-header-cell *matHeaderCellDef>Date of Birth</th>
            <td mat-cell *matCellDef="let p">{{ p.dateOfBirth }}</td>
          </ng-container>

          <!-- Address Column -->
          <ng-container matColumnDef="address">
            <th mat-header-cell *matHeaderCellDef>Address</th>
            <td mat-cell *matCellDef="let p">{{ p.address }}</td>
          </ng-container>

          <!-- Action Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let p">
              <button mat-icon-button color="primary"
                      [routerLink]="['/patients', p.id]"
                      matTooltip="View / Edit">
                <mat-icon>chevron_right</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"
              class="patient-row" [routerLink]="['/patients', row.id]"></tr>
        </table>

        <mat-paginator
          [length]="filteredPatients.length"
          [pageSize]="pageSize"
          [pageSizeOptions]="[5, 10, 25]"
          (page)="onPageChange($event)"
          aria-label="Select page">
        </mat-paginator>
      </div>
    </div>
  `,
    styles: [`
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }
    .toolbar-icon { margin-right: 8px; }
    .toolbar-title { font-size: 18px; font-weight: 500; }
    .spacer { flex: 1 1 auto; }

    .page-content {
      padding: 32px 24px;
      max-width: 1200px;
      margin: 0 auto;
      background: #f4f6fb;
      min-height: calc(100vh - 64px);
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 24px;
    }
    .page-title {
      font-size: 24px;
      font-weight: 600;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .count-chip {
      font-size: 14px;
      font-weight: 400;
      background: #e3f2fd;
      color: #1565c0;
      padding: 2px 10px;
      border-radius: 12px;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .search-field {
      width: 320px;
      max-width: 100%;
    }

    .state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 24px;
      gap: 16px;
      color: #757575;
    }
    .state-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      opacity: 0.4;
    }
    .error-state { color: #b71c1c; }

    .table-container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 6px 16px rgba(15,23,42,0.12);
      overflow: hidden;
    }
    .patient-table { width: 100%; }
    .patient-row:hover {
      background: #f5f5f5;
      cursor: pointer;
    }

    .name-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1a237e, #0288d1);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      flex-shrink: 0;
    }

    @media (max-width: 768px) {
      .page-content {
        padding: 24px 16px;
      }
      .list-header {
        align-items: flex-start;
      }
      .header-actions {
        width: 100%;
        justify-content: flex-start;
      }
      .search-field {
        flex: 1 1 auto;
      }
    }
  `]
})
export class PatientListComponent implements OnInit, OnDestroy {
    displayedColumns = ['name', 'email', 'dateOfBirth', 'address', 'actions'];
    allPatients: PatientResponse[] = [];
    filteredPatients: PatientResponse[] = [];
    pageData: PatientResponse[] = [];
    pageSize = 10;
    pageIndex = 0;

    loading = false;
    error: string | null = null;
    searchCtrl = new FormControl('');

    private destroy$ = new Subject<void>();

    constructor(
        private patientApi: PatientApiService,
        private authState: AuthStateService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadPatients();

        // Debounced client-side search
        // TODO: Replace with server-side ?search= query param once backend supports it
        this.searchCtrl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.pageIndex = 0;
            this.applyFilter();
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadPatients(): void {
        this.loading = true;
        this.error = null;
        this.patientApi.getAll().subscribe({
            next: (patients) => {
                this.allPatients = patients;
                this.applyFilter();
                this.loading = false;
            },
            error: (err) => {
                this.loading = false;
                this.error = err.error?.message ?? 'Failed to load patients. Please try again.';
            }
        });
    }

    private applyFilter(): void {
        const term = (this.searchCtrl.value ?? '').toLowerCase().trim();
        this.filteredPatients = term
            ? this.allPatients.filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.email.toLowerCase().includes(term) ||
                p.address.toLowerCase().includes(term)
            )
            : [...this.allPatients];
        this.updatePageData();
    }

    private updatePageData(): void {
        const start = this.pageIndex * this.pageSize;
        this.pageData = this.filteredPatients.slice(start, start + this.pageSize);
    }

    onPageChange(event: PageEvent): void {
        this.pageSize = event.pageSize;
        this.pageIndex = event.pageIndex;
        this.updatePageData();
    }

    logout(): void {
        this.authState.clearToken();
        this.router.navigate(['/login']);
    }
}
