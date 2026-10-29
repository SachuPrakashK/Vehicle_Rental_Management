import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FieldErrorComponent } from '../../../../shared/components/field-error/field-error.component';
import { IconComponent } from '../../../../shared/icons/icon.component';

@Component({
  selector: 'app-password-field',
  imports: [ReactiveFormsModule, FieldErrorComponent, IconComponent],
  templateUrl: './password-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordFieldComponent {
  readonly control = input.required<FormControl<string>>();
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly placeholder = input.required<string>();
  readonly autocomplete = input('current-password');
  readonly required = input(true);
  readonly visible = signal(false);
}
