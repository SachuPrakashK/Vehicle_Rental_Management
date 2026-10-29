import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SILENT_REQUEST } from '../http/http-context';
import { FeedbackService } from '../services/feedback.service';
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const feedback = inject(FeedbackService);

  return next(request).pipe(
    timeout(30000),
    catchError((error: unknown) => {
      let message = 'The request timed out. Please try again.';
      if (error instanceof HttpErrorResponse) {
        const authRequest = request.url.startsWith(environment.authApiBaseUrl + '/');
        const loginRequest = request.url.endsWith('/auth/login');
        message =
          error.status === 0
            ? authRequest
              ? 'The application service is unavailable. Please try again shortly.'
              : 'Unable to reach the service. Please try again.'
            : error.status === 401 && loginRequest
              ? 'Invalid email or password.'
              : error.status === 401
                ? 'Your session has expired. Please sign in again.'
                : error.status === 403
                  ? 'You do not have permission to perform this action.'
                  : error.status === 404
                    ? 'The requested record could not be found.'
                    : error.status === 409
                      ? 'A record with these details already exists.'
                      : error.status === 413
                        ? 'The selected image exceeds the 5 MB limit.'
                        : error.status === 422
                          ? 'Please review the entered information and try again.'
                          : error.status === 429
                            ? 'Too many attempts. Please try again later.'
                            : 'Unable to complete the request. Please try again.';
      }
      if (!request.context.get(SILENT_REQUEST)) feedback.toast(message, 'error');
      return throwError(() => new Error(message));
    }),
  );
};
