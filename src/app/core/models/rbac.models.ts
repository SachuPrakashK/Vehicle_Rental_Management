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
  | 'authorization.audit'
  | 'fleet.overview.view'
  | 'fleet.tracking.view'
  | 'fleet.tracking.history.view'
  | 'fleet.tracking.devices.manage'
  | 'fleet.health.view'
  | 'fleet.health.assess'
  | 'fleet.maintenance.view'
  | 'fleet.maintenance.create'
  | 'fleet.maintenance.edit'
  | 'fleet.maintenance.complete'
  | 'fleet.maintenance.delete'
  | 'fleet.geofences.view'
  | 'fleet.geofences.create'
  | 'fleet.geofences.edit'
  | 'fleet.geofences.delete'
  | 'fleet.alerts.view'
  | 'fleet.alerts.acknowledge'
  | 'fleet.alerts.resolve'
  | 'fleet.analytics.view'
  | 'fleet.analytics.export'
  | 'fleet.predictions.view';

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
