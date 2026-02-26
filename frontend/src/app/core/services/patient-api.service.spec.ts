import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { PatientApiService } from './patient-api.service';
import { PatientRequest, PatientResponse } from '../models/patient.model';
import { environment } from '../../../environments/environment';

describe('PatientApiService', () => {
    let service: PatientApiService;
    let httpMock: HttpTestingController;

    const BASE = `${environment.apiBaseUrl}/api/patients`;

    const mockPatient: PatientResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        address: '456 Oak Ave',
        dateOfBirth: '1985-03-20'
    };

    const mockRequest: PatientRequest = {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        address: '456 Oak Ave',
        dateOfBirth: '1985-03-20',
        registeredDate: '2026-02-25'
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                PatientApiService
            ]
        });
        service = TestBed.inject(PatientApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify(); // Ensure no unexpected requests remain
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('getAll() should make GET request to /api/patients', () => {
        service.getAll().subscribe(patients => {
            expect(patients.length).toBe(1);
            expect(patients[0].name).toBe('Alice Johnson');
        });

        const req = httpMock.expectOne(BASE);
        expect(req.request.method).toBe('GET');
        req.flush([mockPatient]);
    });

    it('create() should make POST request to /api/patients with correct body', () => {
        service.create(mockRequest).subscribe(patient => {
            expect(patient.id).toBe(mockPatient.id);
            expect(patient.email).toBe('alice@example.com');
        });

        const req = httpMock.expectOne(BASE);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(mockRequest);
        req.flush(mockPatient);
    });

    it('update() should make PUT request to /api/patients/:id', () => {
        const updateReq: PatientRequest = { ...mockRequest, name: 'Alice Smith' };

        service.update(mockPatient.id, updateReq).subscribe(patient => {
            expect(patient.name).toBe('Alice Smith');
        });

        const req = httpMock.expectOne(`${BASE}/${mockPatient.id}`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(updateReq);
        req.flush({ ...mockPatient, name: 'Alice Smith' });
    });

    it('delete() should make DELETE request to /api/patients/:id', () => {
        service.delete(mockPatient.id).subscribe(result => {
            expect(result).toBeNull(); // 204 No Content resolves to null
        });

        const req = httpMock.expectOne(`${BASE}/${mockPatient.id}`);
        expect(req.request.method).toBe('DELETE');
        req.flush(null, { status: 204, statusText: 'No Content' });
    });
});
