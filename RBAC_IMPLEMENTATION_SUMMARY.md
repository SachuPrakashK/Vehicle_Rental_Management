# Fleetline RBAC Implementation Summary

Fleetline now has normalized, database-backed RBAC with exact Staff and Admin defaults, protected Super Admin authority, custom roles, multi-role assignments, effective permission unions, audit logs, optimistic role updates, server middleware, APIs, Angular permission state, guarded routes, dynamic navigation, permission-aware actions, a responsive permission matrix, and Admin User role assignment.

Key backend additions include `003_rbac.sql`, RBAC models/repository/controller/routes/validators, fresh permission resolution in authentication middleware, and permission enforcement on Fleetline-owned Admin User, bike, and upload APIs.

Key Angular additions include `PermissionService`, `permissionGuard`, `HasPermissionDirective`, typed RBAC models/service, the Access Denied page, Roles & Permissions feature, dynamic sidebar, action filtering, and user role assignment.

No new runtime dependency was introduced. Existing authentication/session behavior and the legacy role field remain compatible.

Known limitation: cars, customers, bookings, dashboard, and ledger operations that call CarRentalApp directly have frontend permission enforcement only. A future backend proxy/migration is required for authoritative server-side RBAC on those third-party resources.
