import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { unsavedGuard } from './core/guards/unsaved.guard';
import { superAdminGuard } from './core/guards/role.guard';
export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/pages/register/register.component').then(
            (m) => m.RegisterComponent,
          ),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/pages/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent,
          ),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/pages/reset-password/reset-password.component').then(
            (m) => m.ResetPasswordComponent,
          ),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'vehicles',
        canDeactivate: [unsavedGuard],
        loadComponent: () =>
          import('./features/vehicles/vehicles.component').then((m) => m.VehiclesComponent),
      },
      {
        path: 'customers/:id',
        canDeactivate: [unsavedGuard],
        loadComponent: () =>
          import('./features/customers/customers.component').then((m) => m.CustomersComponent),
      },
      {
        path: 'customers',
        canDeactivate: [unsavedGuard],
        loadComponent: () =>
          import('./features/customers/customers.component').then((m) => m.CustomersComponent),
      },
      {
        path: 'book-vehicle',
        canDeactivate: [unsavedGuard],
        loadComponent: () =>
          import('./features/bookings/book-vehicle.component').then((m) => m.BookVehicleComponent),
      },
      {
        path: 'bookings/:id',
        loadComponent: () =>
          import('./features/bookings/bookings.component').then((m) => m.BookingsComponent),
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./features/bookings/bookings.component').then((m) => m.BookingsComponent),
      },
      {
        path: 'customer-ledger',
        loadComponent: () =>
          import('./features/customer-ledger/customer-ledger.component').then(
            (m) => m.CustomerLedgerComponent,
          ),
      },
      {
        path: 'admin-users',
        canActivate: [superAdminGuard],
        canDeactivate: [unsavedGuard],
        loadComponent: () =>
          import('./features/admin-users/admin-users.component').then((m) => m.AdminUsersComponent),
      },
      {
        path: 'profile',
        canDeactivate: [unsavedGuard],
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'not-found',
        loadComponent: () =>
          import('./shared/components/not-found/not-found.component').then(
            (m) => m.NotFoundComponent,
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'not-found' },
];
