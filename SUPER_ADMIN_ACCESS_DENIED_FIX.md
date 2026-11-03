# Super Admin Access Denied — Code Fix

## Findings

1. `AuthStore.updateUser()` replaced the complete authenticated user with profile endpoint responses containing no `permissions` or `roles`. This emptied the frontend permission snapshot and caused `permissionGuard` to redirect to `/access-denied`.
2. Permission resolution only consulted `user_roles` and `role_permissions`. Existing `users.role = SUPER_ADMIN` accounts lacking migrated join records could receive zero permissions after login, despite the existing backend treating their legacy role as Super Admin for some endpoints.

## Changes

- Preserve existing RBAC fields for profile-only updates in Angular AuthStore.
- Resolve full registered permissions for active Super Admin accounts from the trusted legacy `users.role` and protected system-role record, while continuing to resolve all other role assignments normally. This does not elevate Admin or Staff accounts.
- Added idempotent migration `004_restore_system_role_assignments.sql` to repair missing legacy role associations and protected Super Admin role permissions.

## Deployment

1. Back up the database.
2. Deploy both frontend and backend changes.
3. Run `npm run db:migrate` from the repository root using the configured backend database.
4. Log out and log in again as Super Admin; validate Dashboard, Admin Users, and Roles & Permissions.
5. Confirm Admin and Staff are denied unauthorized endpoints (API and UI).

## Verification limitations

Static source analysis establishes the two defects. Real account and email/server tests depend on a running configured PostgreSQL/backend environment, which is not bundled as a test deployment. Do not treat a successful build as an end-to-end authorization test.
