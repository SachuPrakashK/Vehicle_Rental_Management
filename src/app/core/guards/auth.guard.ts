import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
export const authGuard: CanActivateFn = (_, state) =>
  inject(AuthService).canEnter() ||
  inject(Router).createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
export const guestGuard: CanActivateFn = () =>
  !inject(AuthService).canEnter() || inject(Router).createUrlTree(['/dashboard']);
