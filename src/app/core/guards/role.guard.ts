import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../services/auth-store.service';
import type { PermissionCode } from '../models/rbac.models';
import { PermissionService } from '../services/permission.service';
import { AuthService } from '../services/auth.service';
import { catchError, map, of } from 'rxjs';
export const superAdminGuard: CanActivateFn = () =>
  inject(AuthStore).isSuperAdmin() || inject(Router).createUrlTree(['/dashboard']);

export const permissionGuard: CanActivateFn = (route) => {
  const permission = route.data['permission'] as PermissionCode | undefined;
  if (!permission) return true;
  const auth = inject(AuthService);
  const permissions = inject(PermissionService);
  const router = inject(Router);
  return auth.refreshAuthorization().pipe(
    map(() => (permissions.has(permission) ? true : router.createUrlTree(['/access-denied']))),
    catchError(() => of(router.createUrlTree(['/auth/login']))),
  );
};
