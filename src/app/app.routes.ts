import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { unsavedGuard } from './core/guards/unsaved.guard';
import { permissionGuard } from './core/guards/role.guard';
export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        title: 'Login',
        loadComponent: () =>
          import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        title: 'Register',
        loadComponent: () =>
          import('./features/auth/pages/register/register.component').then(
            (m) => m.RegisterComponent,
          ),
      },
      {
        path: 'forgot-password',
        title: 'Forgot Password',
        loadComponent: () =>
          import('./features/auth/pages/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent,
          ),
      },
      {
        path: 'reset-password',
        title: 'Reset Password',
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
        title: 'Dashboard',
        canActivate: [permissionGuard],
        data: { permission: 'dashboard.view' },
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'vehicles',
        title: 'Vehicles',
        canActivate: [permissionGuard],
        data: { permission: 'vehicles.view' },
        canDeactivate: [unsavedGuard],
        loadComponent: () =>
          import('./features/vehicles/vehicles.component').then((m) => m.VehiclesComponent),
      },
      {
        path: 'customers/:id',
        title: 'Customer Details',
        canActivate: [permissionGuard],
        data: { permission: 'customers.view' },
        canDeactivate: [unsavedGuard],
        loadComponent: () =>
          import('./features/customers/customers.component').then((m) => m.CustomersComponent),
      },
      {
        path: 'customers',
        title: 'Customers',
        canActivate: [permissionGuard],
        data: { permission: 'customers.view' },
        canDeactivate: [unsavedGuard],
        loadComponent: () =>
          import('./features/customers/customers.component').then((m) => m.CustomersComponent),
      },
      {
        path: 'book-vehicle',
        title: 'Book Vehicle',
        canActivate: [permissionGuard],
        data: { permission: 'bookings.create' },
        canDeactivate: [unsavedGuard],
        loadComponent: () =>
          import('./features/bookings/book-vehicle.component').then((m) => m.BookVehicleComponent),
      },
      {
        path: 'bookings/:id',
        title: 'Booking Details',
        canActivate: [permissionGuard],
        data: { permission: 'bookings.view' },
        loadComponent: () =>
          import('./features/bookings/bookings.component').then((m) => m.BookingsComponent),
      },
      {
        path: 'bookings',
        title: 'Bookings',
        canActivate: [permissionGuard],
        data: { permission: 'bookings.view' },
        loadComponent: () =>
          import('./features/bookings/bookings.component').then((m) => m.BookingsComponent),
      },
      {
        path: 'customer-ledger',
        title: 'Customer Ledger',
        canActivate: [permissionGuard],
        data: { permission: 'ledger.view' },
        loadComponent: () =>
          import('./features/customer-ledger/customer-ledger.component').then(
            (m) => m.CustomerLedgerComponent,
          ),
      },
      {
        path: 'admin-users',
        title: 'Admin Users',
        canActivate: [permissionGuard],
        data: { permission: 'users.view' },
        canDeactivate: [unsavedGuard],
        loadComponent: () =>
          import('./features/admin-users/admin-users.component').then((m) => m.AdminUsersComponent),
      },
      {
        path: 'roles-permissions',
        title: 'Roles & Permissions',
        canActivate: [permissionGuard],
        data: { permission: 'roles.view' },
        loadComponent: () =>
          import('./features/roles-permissions/roles-permissions.component').then(
            (m) => m.RolesPermissionsComponent,
          ),
      },
      {
        path: 'fleet-intelligence',
        canActivate: [permissionGuard],
        data: { permission: 'fleet.overview.view' },
        children: [
          {
            path: '',
            title: 'Smart Fleet Intelligence',
            data: { section: 'overview' },
            loadComponent: () =>
              import('./features/fleet-intelligence/fleet-intelligence.component').then(
                (m) => m.FleetIntelligenceComponent,
              ),
          },
          {
            path: 'maintenance',
            title: 'Fleet Maintenance',
            data: { section: 'maintenance', permission: 'fleet.maintenance.view' },
            canActivate: [permissionGuard],
            loadComponent: () =>
              import('./features/fleet-intelligence/fleet-intelligence.component').then(
                (m) => m.FleetIntelligenceComponent,
              ),
          },
          {
            path: 'health',
            title: 'Vehicle Health',
            data: { section: 'health', permission: 'fleet.health.view' },
            canActivate: [permissionGuard],
            loadComponent: () =>
              import('./features/fleet-intelligence/fleet-intelligence.component').then(
                (m) => m.FleetIntelligenceComponent,
              ),
          },
          {
            path: 'tracking',
            title: 'Fleet Tracking',
            data: { section: 'tracking', permission: 'fleet.tracking.view' },
            canActivate: [permissionGuard],
            loadComponent: () =>
              import('./features/fleet-intelligence/fleet-intelligence.component').then(
                (m) => m.FleetIntelligenceComponent,
              ),
          },
          {
            path: 'alerts',
            title: 'Fleet Alerts',
            data: { section: 'alerts', permission: 'fleet.alerts.view' },
            canActivate: [permissionGuard],
            loadComponent: () =>
              import('./features/fleet-intelligence/fleet-intelligence.component').then(
                (m) => m.FleetIntelligenceComponent,
              ),
          },
          {
            path: 'geofences',
            title: 'Fleet Geofences',
            data: { section: 'geofences', permission: 'fleet.geofences.view' },
            canActivate: [permissionGuard],
            loadComponent: () =>
              import('./features/fleet-intelligence/fleet-intelligence.component').then(
                (m) => m.FleetIntelligenceComponent,
              ),
          },
          {
            path: 'analytics',
            title: 'Fleet Analytics',
            data: { section: 'analytics', permission: 'fleet.analytics.view' },
            canActivate: [permissionGuard],
            loadComponent: () =>
              import('./features/fleet-intelligence/fleet-intelligence.component').then(
                (m) => m.FleetIntelligenceComponent,
              ),
          },
        ],
      },
      {
        path: 'profile',
        title: 'My Profile',
        canDeactivate: [unsavedGuard],
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'access-denied',
        title: 'Access Denied',
        loadComponent: () =>
          import('./shared/components/access-denied/access-denied.component').then(
            (m) => m.AccessDeniedComponent,
          ),
      },
      {
        path: 'not-found',
        title: 'Page Not Found',
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
