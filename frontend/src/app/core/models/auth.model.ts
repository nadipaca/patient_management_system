/** Request body for POST /auth/login */
export interface LoginRequest {
    email: string;
    password: string;
}

/** Successful response from POST /auth/login */
export interface LoginResponse {
    token: string;
}
