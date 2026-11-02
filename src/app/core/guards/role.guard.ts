import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../services/auth-store.service';
import type { PermissionCode } from '../models/rbac.models';
import { PermissionService } from '../services/permission.service';
export const superAdminGuard: CanActivateFn = () =>
  inject(AuthStore).isSuperAdmin() || inject(Router).createUrlTree(['/dashboard']);

export const permissionGuard: CanActivateFn = (route) => {
  const permission = route.data['permission'] as PermissionCode | undefined;
  return !permission || inject(PermissionService).has(permission)
    ? true
    : inject(Router).createUrlTree(['/access-denied']);
};
