import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
export const nonBlank: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && !control.value.trim() ? { whitespace: true } : null;
export const phoneValidator: ValidatorFn = (control) =>
  !control.value || /^\d{10}$/.test(control.value) ? null : { phone: true };
export const httpsValidator: ValidatorFn = (control) => {
  if (!control.value) return null;
  if (typeof control.value === 'string' && control.value.startsWith('/uploads/')) return null;
  try {
    return new URL(control.value).protocol === 'https:' ? null : { url: true };
  } catch {
    return { url: true };
  }
};
export const passwordValidator: ValidatorFn = (control) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/.test(control.value ?? '')
    ? null
    : { password: true };
export const passwordMatch: ValidatorFn = (control) =>
  control.get('password')?.value === control.get('confirmPassword')?.value
    ? null
    : { passwordMismatch: true };
export const dateRangeValidator: ValidatorFn = (control) => {
  const start = control.get('bookingDate')?.value;
  const end = control.get('returnDate')?.value;
  return start &&
    end &&
    (!Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(end)) || end < start)
    ? { dateRange: true }
    : null;
};
export const customPeriodValidator: ValidatorFn = (control) => {
  const start = control.get('from')?.value;
  const end = control.get('to')?.value;
  return start && end && end < start ? { dateRange: true } : null;
};
export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
function validateImage(file: File, subject: string): string | null {
  if (file.size > IMAGE_UPLOAD_MAX_BYTES) return `${subject} image must not exceed 5 MB.`;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    return 'Please select a JPG, PNG, or WebP image.';
  return null;
}
export function validateProfileImage(file: File): string | null {
  return validateImage(file, 'Profile');
}
export function validateVehicleImage(file: File): string | null {
  return validateImage(file, 'Vehicle');
}
