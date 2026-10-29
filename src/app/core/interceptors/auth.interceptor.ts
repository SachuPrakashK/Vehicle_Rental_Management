import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
const noRefresh = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh-token',
  '/auth/forgot-password',
  '/auth/verify-reset-token',
  '/auth/reset-password',
];
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(environment.authApiBaseUrl + '/')) return next(request);
  const auth = inject(AuthService);
  const token = auth.accessToken();
  const outgoing = request.clone({
    withCredentials: true,
    setHeaders: token ? { Authorization: 'Bearer ' + token } : {},
  });
  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        noRefresh.some((path) => request.url.endsWith(path))
      )
        return throwError(() => error);
      return auth.refreshSession().pipe(
        switchMap(() =>
          next(
            request.clone({
              withCredentials: true,
              setHeaders: { Authorization: 'Bearer ' + auth.accessToken()! },
            }),
          ),
        ),
        catchError((refreshError) => {
          auth.invalidate();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
