import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { FeedbackService } from '../services/feedback.service';
export const loaderInterceptor: HttpInterceptorFn = (request, next) => {
  const feedback = inject(FeedbackService);
  feedback.begin();
  return next(request).pipe(finalize(() => feedback.end()));
};
