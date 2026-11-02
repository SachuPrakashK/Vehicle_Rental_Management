# Fleetline RBAC Database Migration

Migration: `server/src/database/migrations/003_rbac.sql`

## Added structures

- `roles`
- `permissions`
- `role_permissions`
- `user_roles`
- `authorization_audit_logs`

The migration seeds protected `SUPER_ADMIN`, `ADMIN`, and `STAFF` roles and the exact default matrices. Existing users are mapped from `users.role` without changing passwords, sessions, profile data, or IDs. Constraints prevent orphaned mappings, duplicate codes, and duplicate assignments.

## Apply

```bash
cd server
npm run db:migrate
```

The migration runner records `003_rbac.sql` in `schema_migrations`, so repeated runs are safe.

## Rollback

Back up the database before production migration. A manual rollback, after stopping the application and confirming no custom assignments must be retained, is:

```sql
DROP TABLE authorization_audit_logs;
DROP TABLE user_roles;
DROP TABLE role_permissions;
DROP TABLE permissions;
DROP TABLE roles;
DELETE FROM schema_migrations WHERE name='003_rbac.sql';
```

The legacy `users.role` column remains intact, so authentication data is preserved. Restore the backup instead of manual rollback when authorization changes must be retained.
