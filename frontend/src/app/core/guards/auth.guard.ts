import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';

/**
 * Functional route guard (Angular 17 standalone style).
 * Redirects unauthenticated users to /login.
 */
export const authGuard: CanActivateFn = () => {
    const authState = inject(AuthStateService);
    const router = inject(Router);

    if (authState.isLoggedIn()) {
        return true;
    }
    return router.createUrlTree(['/login']);
};
