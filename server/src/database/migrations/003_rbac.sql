CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(80) NOT NULL,
  code varchar(80) NOT NULL UNIQUE,
  description varchar(300),
  is_system_role boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module varchar(80) NOT NULL,
  action varchar(40) NOT NULL,
  code varchar(120) NOT NULL UNIQUE,
  description varchar(300) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  assigned_by uuid REFERENCES users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);
CREATE INDEX IF NOT EXISTS user_roles_user_idx ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS user_roles_role_idx ON user_roles(role_id);

CREATE TABLE IF NOT EXISTS authorization_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  target_role_id uuid REFERENCES roles(id) ON DELETE SET NULL,
  action varchar(100) NOT NULL,
  before_state jsonb,
  after_state jsonb,
  request_id varchar(100),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS authorization_audit_created_idx ON authorization_audit_logs(created_at DESC);

INSERT INTO roles(name, code, description, is_system_role)
VALUES
  ('Super Admin', 'SUPER_ADMIN', 'Protected system administration role.', true),
  ('Admin', 'ADMIN', 'Rental operations administrator.', true),
  ('Staff', 'STAFF', 'Daily rental operations staff.', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions(module, action, code, description)
VALUES
  ('Dashboard', 'View', 'dashboard.view', 'View the dashboard.'),
  ('Vehicles', 'View', 'vehicles.view', 'View vehicles.'),
  ('Vehicles', 'Create', 'vehicles.create', 'Create vehicles.'),
  ('Vehicles', 'Edit', 'vehicles.edit', 'Edit vehicles.'),
  ('Vehicles', 'Delete', 'vehicles.delete', 'Delete vehicles.'),
  ('Bookings', 'View', 'bookings.view', 'View bookings.'),
  ('Bookings', 'Create', 'bookings.create', 'Create bookings.'),
  ('Bookings', 'Edit', 'bookings.edit', 'Edit bookings.'),
  ('Bookings', 'Cancel', 'bookings.cancel', 'Cancel bookings.'),
  ('Bookings', 'Delete', 'bookings.delete', 'Delete bookings.'),
  ('Customers', 'View', 'customers.view', 'View customers.'),
  ('Customers', 'Create', 'customers.create', 'Create customers.'),
  ('Customers', 'Edit', 'customers.edit', 'Edit customers.'),
  ('Customers', 'Delete', 'customers.delete', 'Delete customers.'),
  ('Customer Ledger', 'View', 'ledger.view', 'View the customer ledger.'),
  ('Customer Ledger', 'Create', 'ledger.create', 'Create ledger entries.'),
  ('Customer Ledger', 'Edit', 'ledger.edit', 'Edit ledger entries.'),
  ('Customer Ledger', 'Export', 'ledger.export', 'Export ledger data.'),
  ('Reports', 'View', 'reports.view', 'View reports.'),
  ('Reports', 'Export', 'reports.export', 'Export reports.'),
  ('Admin Users', 'View', 'users.view', 'View administrative users.'),
  ('Admin Users', 'Create', 'users.create', 'Create administrative users.'),
  ('Admin Users', 'Edit', 'users.edit', 'Edit administrative users.'),
  ('Admin Users', 'Deactivate', 'users.deactivate', 'Deactivate administrative users.'),
  ('Admin Users', 'Assign Role', 'users.assign_role', 'Assign roles to users.'),
  ('Roles', 'View', 'roles.view', 'View roles and permissions.'),
  ('Roles', 'Create', 'roles.create', 'Create custom roles.'),
  ('Roles', 'Edit', 'roles.edit', 'Edit custom roles.'),
  ('Roles', 'Delete', 'roles.delete', 'Delete custom roles.'),
  ('Roles', 'Assign Permissions', 'roles.assign_permissions', 'Assign permissions to roles.'),
  ('Authorization', 'Audit', 'authorization.audit', 'View authorization audit logs.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON true WHERE r.code = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code = ANY(ARRAY[
  'dashboard.view','vehicles.view','vehicles.create','vehicles.edit','vehicles.delete',
  'bookings.view','bookings.create','bookings.edit','bookings.cancel','bookings.delete',
  'customers.view','customers.create','customers.edit','customers.delete',
  'ledger.view','ledger.create','ledger.edit','ledger.export','reports.view','reports.export'
]) WHERE r.code = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code = ANY(ARRAY[
  'dashboard.view','vehicles.view','bookings.view','bookings.create','bookings.edit',
  'customers.view','customers.create','customers.edit'
]) WHERE r.code = 'STAFF'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles(user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.code = u.role
ON CONFLICT DO NOTHING;
