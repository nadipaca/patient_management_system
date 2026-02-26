import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'patients',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadComponent: () =>
            import('./features/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'patients',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./features/patient-list/patient-list.component').then(
                m => m.PatientListComponent
            )
    },
    {
        path: 'patients/new',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./features/patient-create/patient-create.component').then(
                m => m.PatientCreateComponent
            )
    },
    {
        path: 'patients/:id',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./features/patient-detail/patient-detail.component').then(
                m => m.PatientDetailComponent
            )
    },
    {
        path: '**',
        redirectTo: 'patients'
    }
];
