import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';

import { PatientCreateComponent } from './patient-create.component';
import { PatientApiService } from '../../core/services/patient-api.service';
import { HttpErrorResponse } from '@angular/common/http';

describe('PatientCreateComponent', () => {
    let fixture: ComponentFixture<PatientCreateComponent>;
    let component: PatientCreateComponent;
    let mockPatientApi: jasmine.SpyObj<PatientApiService>;
    let mockRouter: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        mockPatientApi = jasmine.createSpyObj('PatientApiService', ['create']);
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [
                PatientCreateComponent, // standalone component
                NoopAnimationsModule
            ],
            providers: [
                { provide: PatientApiService, useValue: mockPatientApi },
                { provide: Router, useValue: mockRouter }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PatientCreateComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should display required errors when form is submitted empty', () => {
        // Submit without filling anything in
        component.onSubmit();
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        const errors = compiled.querySelectorAll('mat-error');

        // Each required field should show an error
        expect(component.form.invalid).toBeTrue();
        expect(component.form.get('name')?.hasError('required')).toBeTrue();
        expect(component.form.get('email')?.hasError('required')).toBeTrue();
        expect(component.form.get('address')?.hasError('required')).toBeTrue();
        expect(component.form.get('dateOfBirth')?.hasError('required')).toBeTrue();
        expect(component.form.get('registeredDate')?.hasError('required')).toBeTrue();
    });

    it('should show email format error when invalid email is entered', () => {
        component.form.patchValue({ email: 'not-an-email' });
        component.form.get('email')?.markAsTouched();
        fixture.detectChanges();

        expect(component.form.get('email')?.hasError('email')).toBeTrue();
    });

    it('should show dateOfBirth pattern error for wrong format', () => {
        component.form.patchValue({ dateOfBirth: '25-03-1985' }); // wrong format
        component.form.get('dateOfBirth')?.markAsTouched();
        fixture.detectChanges();

        expect(component.form.get('dateOfBirth')?.hasError('pattern')).toBeTrue();
    });

    it('should call PatientApiService.create() when form is valid', () => {
        mockPatientApi.create.and.returnValue(of({
            id: 'abc-123',
            name: 'Test Patient',
            email: 'test@example.com',
            address: '123 Main St',
            dateOfBirth: '1990-01-01'
        }));

        component.form.setValue({
            name: 'Test Patient',
            email: 'test@example.com',
            address: '123 Main St',
            dateOfBirth: '1990-01-01',
            registeredDate: '2026-02-25'
        });

        component.onSubmit();

        expect(mockPatientApi.create).toHaveBeenCalledOnceWith({
            name: 'Test Patient',
            email: 'test@example.com',
            address: '123 Main St',
            dateOfBirth: '1990-01-01',
            registeredDate: '2026-02-25'
        });
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/patients', 'abc-123']);
    });

    it('should display server field errors returned by the backend', () => {
        const errorBody = {
            status: 400,
            error: 'Bad Request',
            message: 'Validation failed for one or more fields',
            path: '/patients',
            details: {
                fieldErrors: {
                    email: 'Email already exists: test@example.com'
                }
            }
        };
        mockPatientApi.create.and.returnValue(
            throwError(() => new HttpErrorResponse({ error: errorBody, status: 400 }))
        );

        component.form.setValue({
            name: 'Test Patient',
            email: 'test@example.com',
            address: '123 Main St',
            dateOfBirth: '1990-01-01',
            registeredDate: '2026-02-25'
        });

        component.onSubmit();
        fixture.detectChanges();

        // Email field should have the server error set
        expect(component.form.get('email')?.getError('serverError'))
            .toBe('Email already exists: test@example.com');
        expect(component.apiError).toBe('Validation failed for one or more fields');
    });
});
