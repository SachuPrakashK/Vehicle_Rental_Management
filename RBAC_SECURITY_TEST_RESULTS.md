# Fleetline RBAC Security Test Results

## Automated verification

Executed locally on November 3, 2026:

- `npm run build` in the Angular project: passed.
- `npm run build` in `server`: passed.
- `npm run test:unit` in the Angular project: 5 tests passed.
- `npm test` in `server`: 13 tests passed.
- `npm run db:migrate` in `server`: passed against local PostgreSQL.

The integration suite verifies authentication, token rotation, password recovery, profile/image validation, Staff denial for privileged Admin User and vehicle-image operations, Super Admin access, exact Staff defaults, protected role APIs, protected system-role deletion, custom-role lifecycle, immediate permission freshness, assignment protection, and audit creation.

## Security properties

- Missing authentication returns 401.
- Missing effective permission returns 403.
- Permission lookups are fresh on each protected API request.
- Inactive roles do not contribute permissions.
- Super Admin role permission changes and deletion are rejected.
- Self role mutation and ordinary Super Admin assignment are rejected.
- Permission changes use transactions and role version conflict detection.
- Role/user authorization changes are audit logged without secrets.

## Remaining test scope

End-to-end browser automation for the new role matrix and user role drawer is not yet included. Third-party CarRentalApp endpoints cannot be server-authorized by Fleetline until they are proxied through the custom backend.
