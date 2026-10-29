import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { FieldErrorComponent } from '../../../../shared/components/field-error/field-error.component';
import { customPeriodValidator } from '../../../../shared/utils/validators';

export interface CustomPeriodRange {
  from: string;
  to: string;
}

@Component({
  selector: 'app-custom-period-modal',
  imports: [ReactiveFormsModule, ModalComponent, FieldErrorComponent],
  templateUrl: './custom-period-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomPeriodModalComponent {
  private readonly fb = inject(FormBuilder);
  readonly open = input(false);
  readonly initialRange = input<CustomPeriodRange | null>(null);
  readonly applied = output<CustomPeriodRange>();
  readonly closed = output<void>();
  readonly form = this.fb.nonNullable.group(
    { from: ['', Validators.required], to: ['', Validators.required] },
    { validators: customPeriodValidator },
  );

  constructor() {
    effect(() => {
      if (this.open()) this.form.reset(this.initialRange() ?? { from: '', to: '' });
    });
  }

  apply(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.applied.emit(this.form.getRawValue());
  }
}
