/**
 * Request body for POST /api/patients (create) or PUT /api/patients/:id (update).
 * Mirrors PatientRequestDTO from patient-service.
 * registeredDate is required on CREATE only; omit for UPDATE.
 */
export interface PatientRequest {
    name: string;
    email: string;
    address: string;
    dateOfBirth: string;       // ISO format: YYYY-MM-DD
    registeredDate?: string;   // ISO format: YYYY-MM-DD  (required for create)
}

/**
 * Response shape from GET/POST/PUT /api/patients.
 * Mirrors PatientResponseDTO from patient-service.
 */
export interface PatientResponse {
    id: string;
    name: string;
    email: string;
    address: string;
    dateOfBirth: string;       // ISO format: YYYY-MM-DD
}

/**
 * Standardized error shape returned by the backend's GlobalExceptionHandler.
 */
export interface BackendError {
    timestamp: string;
    status: number;
    error: string;
    message: string;
    path: string;
    details?: {
        fieldErrors?: Record<string, string>;
        violations?: Record<string, string>;
    };
}
