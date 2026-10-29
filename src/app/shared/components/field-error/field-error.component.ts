import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  input,
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
@Component({
  selector: 'app-field-error',
  templateUrl: './field-error.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldErrorComponent {
  readonly control = input.required<AbstractControl>();
  private readonly changeDetector = inject(ChangeDetectorRef);
  constructor() {
    effect((onCleanup) => {
      const subscription = this.control().events.subscribe(() =>
        this.changeDetector.markForCheck(),
      );
      onCleanup(() => subscription.unsubscribe());
    });
  }
  message(): string {
    const errors = this.control().errors;
    if (!errors) return '';
    if (errors['required'] || errors['whitespace']) return 'This field is required.';
    if (errors['email']) return 'Enter a valid email address.';
    if (errors['minlength'])
      return 'Enter at least ' + errors['minlength'].requiredLength + ' characters.';
    if (errors['maxlength'])
      return 'Enter no more than ' + errors['maxlength'].requiredLength + ' characters.';
    if (errors['min']) return 'Enter a value of at least ' + errors['min'].min + '.';
    if (errors['max']) return 'Enter a value no greater than ' + errors['max'].max + '.';
    if (errors['phone']) return 'Enter a 10-digit mobile number.';
    if (errors['url']) return 'Enter a valid HTTPS image URL.';
    if (errors['password'])
      return 'Use 8+ characters with uppercase, lowercase, number, and special character.';
    return 'Enter a valid value.';
  }
}
