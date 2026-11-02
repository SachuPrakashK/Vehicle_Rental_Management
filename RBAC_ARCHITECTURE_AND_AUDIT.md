# Fleetline RBAC Architecture and Audit

## Existing-state audit

Fleetline uses Angular 22 standalone components and an Express 5/TypeScript API backed by PostgreSQL through `pg`. Authentication uses short-lived JWT access tokens and rotated, hashed refresh sessions. Before this change, authorization was limited to a mutable `users.role` string and `requireRole('SUPER_ADMIN')` on Admin Users. Rental data for cars, customers, bookings, ledger, and dashboard is primarily fetched directly from CarRentalApp; Fleetline owns authentication, admin users, bikes, and image upload APIs.

## Security findings addressed

- Added deny-by-default granular permissions resolved from PostgreSQL on every authenticated request.
- Added normalized roles, permissions, mappings, user assignments, versioning, and authorization audit logs.
- Protected system roles and Super Admin permissions from ordinary editing or deletion.
- Prevented self role changes and ordinary assignment of Super Admin.
- Added optimistic version checks for concurrent role and permission updates.
- Added Angular permission guards, permission-aware navigation/actions, and a 403 page.
- Kept JWT claims minimal; effective permissions are not trusted from the token.

## Architecture

`users.role` remains for backward compatibility and token metadata. `user_roles` is authoritative for effective permissions. Active roles contribute the union of their `role_permissions`. `requireAuth` loads the active user, roles, and permissions from the database for every protected request. `requirePermission` enforces specific actions. RBAC administration additionally requires the protected `SUPER_ADMIN` identity.

Angular receives roles and permissions in login, refresh, and `/api/auth/me` responses. `AuthStore` is the single source of truth, `PermissionService` exposes permission checks, `permissionGuard` protects routes, and the sidebar/actions react to the same state.

## Route-to-authorization matrix

| UI/API                      | Required permission                                      |
| --------------------------- | -------------------------------------------------------- |
| Dashboard                   | `dashboard.view`                                         |
| Vehicles list/details       | `vehicles.view`                                          |
| Vehicle create/image upload | `vehicles.create`                                        |
| Vehicle edit                | `vehicles.edit`                                          |
| Vehicle delete              | `vehicles.delete`                                        |
| Bookings list/details       | `bookings.view`                                          |
| Book vehicle                | `bookings.create`                                        |
| Booking edit/cancel/delete  | corresponding booking permission                         |
| Customers list/details      | `customers.view`                                         |
| Customer create/edit/delete | corresponding customer permission                        |
| Customer ledger             | `ledger.view`                                            |
| Admin users                 | `users.*`                                                |
| Roles and permissions       | `roles.*` and protected Super Admin identity             |
| Authorization audit         | `authorization.audit` and protected Super Admin identity |

## Boundary and limitation

CarRentalApp calls made directly by the browser cannot be secured by Fleetline's server middleware. Angular checks improve UX but are not a backend security boundary for those third-party operations. Production-grade enforcement for cars, customers, bookings, dashboard, and ledger requires proxying or migrating those APIs behind Fleetline's backend. Fleetline-owned endpoints are enforced server-side now.

The current application is single-company and has no branch/tenant model, so no tenant predicate was added.
