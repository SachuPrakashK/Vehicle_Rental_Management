import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Customer } from '../../core/models/api.models';
import { CustomerService } from '../../core/services/customer.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { nonBlank, phoneValidator } from '../../shared/utils/validators';
import { showMutationError } from '../../shared/utils/mutation-error';
import { FieldErrorComponent } from '../../shared/components/field-error/field-error.component';
@Component({
  selector: 'app-customer-form',
  imports: [ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './customer-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerFormComponent {
  readonly customer = input<Customer | null>(null);
  readonly booking = input(false);
  readonly saved = output<Customer>();
  readonly busyChange = output<boolean>();
  private readonly service = inject(CustomerService);
  private readonly feedback = inject(FeedbackService);
  private readonly fb = inject(FormBuilder);
  readonly busy = signal(false);
  readonly form = this.fb.nonNullable.group({
    customerId: [0],
    customerName: ['', [Validators.required, nonBlank, Validators.maxLength(100)]],
    customerCity: ['', Validators.maxLength(100)],
    mobileNo: ['', phoneValidator],
    email: ['', [Validators.email, Validators.maxLength(200)]],
  });
  constructor() {
    effect(() => {
      const customer = this.customer();
      this.form.reset({
        customerId: customer?.customerId || 0,
        customerName: customer?.customerName || '',
        customerCity: customer?.customerCity || '',
        mobileNo: customer?.mobileNo || '',
        email: customer?.email || '',
      });
      this.form.controls.email.setValidators(
        this.booking()
          ? [Validators.required, Validators.email, Validators.maxLength(200)]
          : [Validators.email, Validators.maxLength(200)],
      );
      this.form.controls.email.updateValueAndValidity();
    });
  }
  async save(): Promise<void> {
    if (this.busy()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.busy.set(true);
    this.busyChange.emit(true);
    const value = this.form.getRawValue();
    const customer = {
      ...value,
      customerName: value.customerName.trim(),
      customerCity: value.customerCity.trim(),
      email: value.email.trim(),
      mobileNo: value.mobileNo.trim(),
    };
    try {
      const saved = customer.customerId
        ? (await firstValueFrom(this.service.update(customer)), customer)
        : await firstValueFrom(this.service.create(customer));
      this.form.markAsPristine();
      this.feedback.toast(
        customer.customerId ? 'Customer updated successfully.' : 'Customer created successfully.',
      );
      this.saved.emit(saved);
    } catch (error) {
      showMutationError(this.feedback, error);
    } finally {
      this.busy.set(false);
      this.busyChange.emit(false);
    }
  }
}
