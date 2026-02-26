import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PatientRequest, PatientResponse } from '../models/patient.model';

/**
 * Handles all patient CRUD HTTP calls via the Spring Cloud Gateway.
 * Base URL: /api/patients (all routes require JWT — attached by AuthInterceptor)
 *
 * NOTE: The backend does not expose GET /api/patients/:id.
 * The detail view fetches all patients and finds by id client-side.
 * TODO: If a GET-by-id endpoint is added to PatientController, update getById() below.
 *
 * NOTE: The backend does not support server-side search or pagination.
 * Both are implemented client-side in the PatientListComponent.
 * TODO: Add ?page=&size=&search= query params when the backend supports them.
 */
@Injectable({ providedIn: 'root' })
export class PatientApiService {
    private readonly baseUrl = `${environment.apiBaseUrl}/api/patients`;

    constructor(private http: HttpClient) { }

    /** GET /api/patients — returns all patients */
    getAll(): Observable<PatientResponse[]> {
        return this.http.get<PatientResponse[]>(this.baseUrl);
    }

    /** POST /api/patients — creates a new patient; returns 201 with the created record */
    create(patient: PatientRequest): Observable<PatientResponse> {
        return this.http.post<PatientResponse>(this.baseUrl, patient);
    }

    /** PUT /api/patients/:id — updates an existing patient */
    update(id: string, patient: PatientRequest): Observable<PatientResponse> {
        return this.http.put<PatientResponse>(`${this.baseUrl}/${id}`, patient);
    }

    /** DELETE /api/patients/:id — deletes a patient; returns 204 No Content */
    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
