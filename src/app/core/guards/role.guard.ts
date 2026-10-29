import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../services/auth-store.service';
export const superAdminGuard: CanActivateFn = () =>
  inject(AuthStore).isSuperAdmin() || inject(Router).createUrlTree(['/dashboard']);
