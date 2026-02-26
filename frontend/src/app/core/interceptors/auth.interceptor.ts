import { inject } from '@angular/core';
import {
    HttpRequest,
    HttpHandlerFn,
    HttpEvent,
    HttpInterceptorFn,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';

/**
 * Functional HTTP interceptor (Angular 17 standalone style).
 * Two responsibilities:
 *  1. Attaches "Authorization: Bearer <token>" to every outgoing request when logged in.
 *  2. On 401 Unauthorized response: clears the stored token and redirects to /login.
 */
export const authInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const authState = inject(AuthStateService);
    const router = inject(Router);

    const token = authState.getToken();
    const authReq = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                authState.clearToken();
                router.navigate(['/login']);
            }
            return throwError(() => error);
        })
    );
};
