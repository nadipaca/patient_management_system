# Patient Management System — Angular Frontend

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18+ |
| npm | 9+ |
| Angular CLI (optional, global) | 17+ |

The backend must be running. Service ports:
- **Gateway**: `http://localhost:4004` (all API calls route through here)
- patient-service: `4000`, auth-service: `4005` (internal — not called directly by the frontend)

---

## Quick Start

```bash
# 1. Install dependencies
cd frontend
npm install

# 2. Start dev server (opens http://localhost:4200)
npm start

# 3. Run tests (headless)
npm test

# 4. Production build
npm run build
```

---

## Configuring the API Base URL

The API base URL is defined in `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:4004'   // ← change this
};
```

For production, edit `src/environments/environment.prod.ts`.  
The `npm run build` command uses `environment.prod.ts` automatically.

---

## Architecture Overview

```
src/app/
├── core/
│   ├── models/          # TypeScript interfaces (PatientRequest, PatientResponse, BackendError, LoginRequest/Response)
│   ├── services/        # AuthApiService, PatientApiService, AuthStateService
│   ├── interceptors/    # authInterceptor (attaches Bearer token; redirects on 401)
│   └── guards/          # authGuard (protects /patients routes)
├── features/
│   ├── login/           # /login
│   ├── patient-list/    # /patients
│   ├── patient-create/  # /patients/new
│   └── patient-detail/  # /patients/:id
└── shared/
    └── confirm-dialog/  # Reusable Material confirm modal
```

**Approach**: Angular 17 standalone components, Angular Router, ReactiveFormsModule, HttpClient with functional interceptor, Angular Material.

---

## Backend Endpoints Used

| Method | URL | Auth Required |
|--------|-----|---------------|
| `POST` | `/auth/login` | No |
| `GET` | `/api/patients` | Yes (Bearer JWT) |
| `POST` | `/api/patients` | Yes |
| `PUT` | `/api/patients/{id}` | Yes |
| `DELETE` | `/api/patients/{id}` | Yes |

> **Note**: There is no `GET /api/patients/{id}` endpoint in the backend.  
> The detail page fetches the full list and finds the patient client-side (marked TODO in code).

> **Note**: Search and pagination are client-side (debounced). Marked TODO in both `PatientApiService` and `PatientListComponent`.

---

## Demo Flow

1. **Login** → `http://localhost:4200/login`  
   Use credentials from the auth-service (e.g. `testuser@test.com` / `password123`).

2. **Patient List** → `/patients`  
   Browse all patients. Use the search box to filter by name, email, or address.

3. **Create Patient** → click **New Patient** → `/patients/new`  
   Fill out the form. All fields have inline validation. Submit to create.

4. **Patient Detail** → click any row  
   View full details. Click **Edit** to toggle edit mode. Click **Delete** to delete with confirmation.

5. **Logout** → click the logout icon in the toolbar.

---

## Tests

| Test file | What it tests |
|-----------|---------------|
| `patient-api.service.spec.ts` | `PatientApiService` — verifies GET, POST, PUT, DELETE HTTP calls using `HttpTestingController` |
| `patient-create.component.spec.ts` | `PatientCreateComponent` — required errors, email/date format, backend field error mapping |
| `patient-list.component.spec.ts` | `PatientListComponent` — API call on init, table row rendering, debounced search, error state |

Run with: `npm test`

---

## Known Limitations / TODOs

- No `GET /api/patients/:id` endpoint in backend — detail view fetches full list (marked `TODO`)
- No server-side search/pagination — implemented client-side (marked `TODO`)
- No refresh token / token expiry handling — 401 redirects to login
