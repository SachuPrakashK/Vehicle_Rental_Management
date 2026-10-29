import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { FeedbackService } from '../services/feedback.service';
import { AuthService } from '../services/auth.service';
export interface UnsavedChanges {
  hasUnsavedChanges(): boolean;
}
export const unsavedGuard: CanDeactivateFn<UnsavedChanges> = (component) =>
  !inject(AuthService).canEnter() ||
  !component.hasUnsavedChanges() ||
  inject(FeedbackService).confirm(
    'Leave this page?',
    'Your unsaved changes will be lost.',
    'Leave page',
  );
