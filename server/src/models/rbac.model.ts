export interface PermissionRecord {
  id: string;
  module: string;
  action: string;
  code: string;
  description: string;
}

export interface RoleRecord {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isSystemRole: boolean;
  isActive: boolean;
  version: number;
  assignedUsers: number;
  permissions: PermissionRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleSummary {
  id: string;
  name: string;
  code: string;
}
