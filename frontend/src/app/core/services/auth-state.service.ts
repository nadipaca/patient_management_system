import { Injectable } from '@angular/core';

const TOKEN_KEY = 'pm_auth_token';

/**
 * Manages the JWT token in memory (primary) and localStorage (persistence).
 * Storing in memory avoids XSS exposure; localStorage enables page-refresh survival.
 */
@Injectable({ providedIn: 'root' })
export class AuthStateService {
    private token: string | null = null;

    constructor() {
        // Rehydrate from localStorage on startup
        this.token = localStorage.getItem(TOKEN_KEY);
    }

    setToken(token: string): void {
        this.token = token;
        localStorage.setItem(TOKEN_KEY, token);
    }

    getToken(): string | null {
        return this.token;
    }

    clearToken(): void {
        this.token = null;
        localStorage.removeItem(TOKEN_KEY);
    }

    isLoggedIn(): boolean {
        return this.token !== null;
    }
}
