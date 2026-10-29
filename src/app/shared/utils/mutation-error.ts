import { FeedbackService } from '../../core/services/feedback.service';
export function showMutationError(feedback: FeedbackService, error: unknown): string {
  const message =
    error instanceof Error ? error.message : 'Unable to save changes. Please try again.';
  if (!feedback.toasts().some((toast) => toast.message === message))
    feedback.toast(message, 'error');
  return message;
}
