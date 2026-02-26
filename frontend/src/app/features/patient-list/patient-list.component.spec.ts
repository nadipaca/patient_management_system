import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { PatientListComponent } from './patient-list.component';
import { PatientApiService } from '../../core/services/patient-api.service';
import { AuthStateService } from '../../core/services/auth-state.service';

const MOCK_PATIENTS = [
    {
        id: 'id-1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        address: '456 Oak Ave',
        dateOfBirth: '1985-03-20'
    },
    {
        id: 'id-2',
        name: 'Bob Smith',
        email: 'bob@example.com',
        address: '789 Pine Rd',
        dateOfBirth: '1990-07-15'
    }
];

describe('PatientListComponent', () => {
    let fixture: ComponentFixture<PatientListComponent>;
    let component: PatientListComponent;
    let mockPatientApi: jasmine.SpyObj<PatientApiService>;
    let mockAuthState: jasmine.SpyObj<AuthStateService>;

    beforeEach(async () => {
        mockPatientApi = jasmine.createSpyObj('PatientApiService', ['getAll']);
        mockAuthState = jasmine.createSpyObj('AuthStateService', ['clearToken']);
        mockPatientApi.getAll.and.returnValue(of(MOCK_PATIENTS));

        await TestBed.configureTestingModule({
            imports: [
                PatientListComponent,  // standalone component
                RouterTestingModule,
                NoopAnimationsModule
            ],
            providers: [
                { provide: PatientApiService, useValue: mockPatientApi },
                { provide: AuthStateService, useValue: mockAuthState }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PatientListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should call getAll() on init', () => {
        expect(mockPatientApi.getAll).toHaveBeenCalledTimes(1);
    });

    it('should render a row for each patient', () => {
        fixture.detectChanges();
        const rows = fixture.nativeElement.querySelectorAll('tr.mat-mdc-row');
        expect(rows.length).toBe(2);
    });

    it('should display patient names in the table', () => {
        fixture.detectChanges();
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.textContent).toContain('Alice Johnson');
        expect(compiled.textContent).toContain('Bob Smith');
    });

    it('should filter patients when search term is entered', fakeAsync(() => {
        component.searchCtrl.setValue('alice');
        tick(300); // debounce
        fixture.detectChanges();

        expect(component.filteredPatients.length).toBe(1);
        expect(component.filteredPatients[0].name).toBe('Alice Johnson');
    }));

    it('should show all patients when search is cleared', fakeAsync(() => {
        component.searchCtrl.setValue('alice');
        tick(300);
        component.searchCtrl.setValue('');
        tick(300);
        fixture.detectChanges();

        expect(component.filteredPatients.length).toBe(2);
    }));

    it('should show error state when API fails', () => {
        mockPatientApi.getAll.and.returnValue(
            throwError(() => ({ error: { message: 'Service unavailable' } }))
        );
        component.loadPatients();
        fixture.detectChanges();

        expect(component.error).toBe('Service unavailable');

        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.textContent).toContain('Service unavailable');
    });
});
