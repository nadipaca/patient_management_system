import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse } from '../models/auth.model';

/**
 * Handles all HTTP calls to the auth-service via the gateway.
 * Endpoint: POST /auth/login (no JWT required)
 */
@Injectable({ providedIn: 'root' })
export class AuthApiService {
    private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

    constructor(private http: HttpClient) { }

    login(request: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.baseUrl}/login`, request);
    }
}
