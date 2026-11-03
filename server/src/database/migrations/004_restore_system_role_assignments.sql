-- Restore missing legacy user-role mappings after the RBAC upgrade.
-- Never infer elevated roles from email or user-controlled profile fields.
-- The legacy users.role column is the existing trusted source of system-role membership.
INSERT INTO user_roles(user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = u.role AND r.is_system_role = true
WHERE u.role IN ('SUPER_ADMIN', 'ADMIN', 'STAFF')
ON CONFLICT DO NOTHING;

-- Keep the protected Super Admin system-role permission inventory complete.
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.code = 'SUPER_ADMIN' AND r.is_system_role = true
ON CONFLICT DO NOTHING;
