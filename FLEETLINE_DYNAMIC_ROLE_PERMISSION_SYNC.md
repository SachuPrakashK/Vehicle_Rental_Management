# Fleetline Dynamic Role and Permission Synchronization

## Root causes found

- Assign Roles persisted `user_roles`, while Create User and Edit User maintained a separate single `users.role` value and duplicated assignment behavior.
- Create and Edit forms did not submit the same role IDs used by the dedicated assignment workflow.
- Edit User could replace role mappings through controller-specific logic, while unrelated profile updates risked coupling to role changes.
- Angular authorization state was populated at login but was not refreshed before guarded navigation or when returning focus to an active session.
- Admin User actions and role controls were not consistently derived from permission codes.
- The effective-permission query shape was incompatible with the in-memory integration database, masking RBAC regression coverage.

## Backend changes

- Added `role-assignment.service.ts` as the shared transactional role-assignment policy.
- Create User, Edit User, and Assign Roles now validate and replace assignments through that service.
- Role IDs are deduplicated and checked against active backend roles.
- Empty, duplicate, invalid, inactive, self, and protected Super Admin assignments are rejected.
- `user_roles` replacement, legacy system-role synchronization, effective-permission calculation, and audit logging occur in one transaction.
- Profile-only Edit User requests preserve existing role mappings when `roleIds` is omitted.
- Create User requires both `users.create` and `users.assign_role`; Edit User checks `users.assign_role` only when assignments are included.
- Backend routes rely on permission middleware rather than hardcoded role names. Super Admin protections remain enforced in assignment and role-management services.

## Effective permission resolution

- Effective permissions are the distinct union of permissions from every active assigned role.
- Inactive roles are excluded by the repository query.
- Protected active Super Admin authority continues to resolve the complete registry.
- Every protected backend request reloads the current user, roles, and permissions from the database, so stale JWT permission claims are not trusted.
- Permission revocation is effective on the next backend request without waiting for token expiration.

## Angular synchronization strategy

- `AuthStore` remains the single source of user, role, and permission state.
- `AuthService.refreshAuthorization()` refreshes `/api/auth/me/permissions` into that store.
- Permission route guards refresh authorization before allowing protected navigation.
- The main layout refreshes authorization when the window regains focus or the document becomes visible.
- If refreshed permissions no longer allow the active route, the user is redirected to the first authorized module and receives a professional notification.
- Sidebar visibility, route guards, permission directives, and feature actions continue reading the same `PermissionService` signal.

## Admin Users UI

- Create User and Edit User use active backend roles and submit role IDs.
- Existing assignments are preselected; Staff is selected by default for new users when available.
- The dedicated Assign Roles drawer uses the same role IDs and backend service.
- Save is disabled for empty or unchanged assignments.
- Role badges and effective permission counts refresh after changes.
- Add, Edit, Assign Roles, and Delete actions are shown from permission codes.
- Protected Super Admin assignments are read-only.

## Session behavior and security

- Existing access tokens identify the user only; backend middleware recalculates current authorization for each request.
- Refresh and login responses always contain current roles and effective permissions.
- Other active browser sessions receive updated navigation and actions on their next guarded navigation, focus, or visibility event.
- API access is revoked immediately even before the remote UI refreshes.
- No WebSocket or additional real-time infrastructure was introduced.

## Verification

- Angular production build passes.
- Backend TypeScript build passes.
- Backend integration coverage verifies dedicated assignment, Create User, Edit User, profile-only updates, immediate effective permissions, audit logging, and Super Admin protection.
- Frontend unit and browser suites use the refreshed authorization response contract.

## Remaining limitations

- UI synchronization for a continuously open, idle tab occurs on focus, visibility change, or guarded navigation rather than through push notifications.
- The legacy `users.role` column remains for token and compatibility purposes and is synchronized when an assigned Admin or Staff system role changes.
- Custom-role-only users retain their existing compatible legacy role while authorization is determined exclusively from `user_roles` and `role_permissions`.
