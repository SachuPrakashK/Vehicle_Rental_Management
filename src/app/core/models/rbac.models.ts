export type PermissionCode =
  | 'dashboard.view'
  | 'vehicles.view'
  | 'vehicles.create'
  | 'vehicles.edit'
  | 'vehicles.delete'
  | 'bookings.view'
  | 'bookings.create'
  | 'bookings.edit'
  | 'bookings.cancel'
  | 'bookings.delete'
  | 'customers.view'
  | 'customers.create'
  | 'customers.edit'
  | 'customers.delete'
  | 'ledger.view'
  | 'ledger.create'
  | 'ledger.edit'
  | 'ledger.export'
  | 'reports.view'
  | 'reports.export'
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.deactivate'
  | 'users.assign_role'
  | 'roles.view'
  | 'roles.create'
  | 'roles.edit'
  | 'roles.delete'
  | 'roles.assign_permissions'
  | 'authorization.audit';

export interface Permission {
  id: string;
  module: string;
  action: string;
  code: PermissionCode;
  description: string;
}

export interface RbacRole {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isSystemRole: boolean;
  isActive: boolean;
  version: number;
  assignedUsers: number;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}
