# Fleetline RBAC API Documentation

All responses use Fleetline's `{ success, message, data }` contract. All endpoints below require a valid access token. Unauthorized requests return 401; authenticated requests without permission return 403.

| Method | Endpoint                                   | Requirement                              | Purpose                                 |
| ------ | ------------------------------------------ | ---------------------------------------- | --------------------------------------- |
| GET    | `/api/auth/me/permissions`                 | Authenticated                            | Current effective roles and permissions |
| GET    | `/api/authorization/permissions`           | Super Admin + `roles.view`               | Permission registry                     |
| GET    | `/api/authorization/roles`                 | Super Admin + `roles.view`               | Roles with counts and permissions       |
| GET    | `/api/authorization/roles/:id`             | Super Admin + `roles.view`               | Role details                            |
| POST   | `/api/authorization/roles`                 | Super Admin + `roles.create`             | Create custom role                      |
| PATCH  | `/api/authorization/roles/:id`             | Super Admin + `roles.edit`               | Update custom role metadata             |
| PUT    | `/api/authorization/roles/:id/permissions` | Super Admin + `roles.assign_permissions` | Replace role permissions                |
| DELETE | `/api/authorization/roles/:id`             | Super Admin + `roles.delete`             | Delete unused custom role               |
| GET    | `/api/authorization/users/:id/roles`       | Super Admin + `users.view`               | User role assignments                   |
| PUT    | `/api/authorization/users/:id/roles`       | Super Admin + `users.assign_role`        | Replace eligible user roles             |
| GET    | `/api/authorization/audit-logs`            | Super Admin + `authorization.audit`      | Recent authorization changes            |

Create role body: `{ name, code, description, isActive }`. Codes must match `^[A-Z][A-Z0-9_]{1,79}$` and are immutable after creation.

Update role body: `{ name, description, isActive, version }`. Permission assignment body: `{ permissionIds, version }`. A stale version returns 409. User assignment body: `{ roleIds }`; it cannot be empty, target self, contain inactive roles, or assign Super Admin.
