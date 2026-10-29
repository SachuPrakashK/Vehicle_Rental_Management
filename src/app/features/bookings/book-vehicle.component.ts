import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, forkJoin } from 'rxjs';
import { Customer, Vehicle } from '../../core/models/api.models';
import { CustomerService } from '../../core/services/customer.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { BookingService } from '../../core/services/booking.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { dateRangeValidator } from '../../shared/utils/validators';
import { showMutationError } from '../../shared/utils/mutation-error';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { DrawerComponent } from '../../shared/components/drawer/drawer.component';
import { FieldErrorComponent } from '../../shared/components/field-error/field-error.component';
import { IconComponent } from '../../shared/icons/icon.component';
import { CustomerFormComponent } from '../customers/customer-form.component';
import { environment } from '../../../environments/environment';
import { SearchComponent } from '../../shared/components/search/search.component';
@Component({
  selector: 'app-book-vehicle',
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    PageHeaderComponent,
    DrawerComponent,
    FieldErrorComponent,
    IconComponent,
    CustomerFormComponent,
    SearchComponent,
  ],
  templateUrl: './book-vehicle.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookVehicleComponent {
  private readonly customerService = inject(CustomerService);
  private readonly vehicleService = inject(VehicleService);
  private readonly service = inject(BookingService);
  private readonly feedback = inject(FeedbackService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  readonly customers = signal<Customer[]>([]);
  readonly vehicles = signal<Vehicle[]>([]);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly drawerOpen = signal(false);
  readonly customerBusy = signal(false);
  readonly customerForm = viewChild(CustomerFormComponent);
  readonly currency = environment.currency;
  readonly customerSearch = signal('');
  readonly filteredCustomers = computed(() =>
    this.customers().filter((customer) =>
      [customer.customerName, customer.mobileNo, customer.email]
        .join(' ')
        .toLowerCase()
        .includes(this.customerSearch().toLowerCase()),
    ),
  );
  readonly form = this.fb.nonNullable.group(
    {
      customerId: [0, [Validators.required, Validators.min(1)]],
      carId: [0, [Validators.required, Validators.min(1)]],
      bookingDate: ['', Validators.required],
      returnDate: ['', Validators.required],
      discount: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
      totalBillAmount: [0, [Validators.required, Validators.min(0), Validators.max(100000000)]],
    },
    { validators: dateRangeValidator },
  );
  private readonly values = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  readonly customer = computed(() =>
    this.customers().find((customer) => customer.customerId === this.values().customerId),
  );
  readonly vehicle = computed(() =>
    this.vehicles().find((vehicle) => vehicle.carId === this.values().carId),
  );
  constructor() {
    void this.load();
  }
  async load(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    try {
      const data = await firstValueFrom(
        forkJoin({
          customers: this.customerService.list(),
          vehicles: this.vehicleService.list(),
        }).pipe(takeUntilDestroyed(this.destroyRef)),
      );
      this.customers.set(data.customers);
      this.vehicles.set(data.vehicles);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to load booking options.');
    } finally {
      this.loading.set(false);
    }
  }
  customerSaved(customer: Customer): void {
    this.customers.update((items) => [
      ...items.filter((item) => item.customerId !== customer.customerId),
      customer,
    ]);
    this.customerSearch.set('');
    this.form.controls.customerId.setValue(customer.customerId);
    this.form.markAsDirty();
    this.drawerOpen.set(false);
  }
  hasUnsavedChanges(): boolean {
    return (
      this.busy() || this.customerBusy() || this.form.dirty || !!this.customerForm()?.form.dirty
    );
  }
  async save(): Promise<void> {
    if (this.busy() || this.customerBusy()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    const customer = this.customer();
    const vehicle = this.vehicle();
    if (!customer || !vehicle) {
      this.feedback.toast('Select an existing customer and vehicle.', 'error');
      return;
    }
    if (vehicle.vehicleType === 'BIKE') {
      this.feedback.toast(
        'Bike bookings are not available yet. Choose a car to continue.',
        'warning',
      );
      return;
    }
    if (!customer.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      this.feedback.toast(
        'This customer needs a valid email address. Update the customer before booking.',
        'warning',
      );
      return;
    }
    if (customer.mobileNo && !/^\d{10}$/.test(customer.mobileNo)) {
      this.feedback.toast(
        'Update the customer mobile number to 10 digits before booking.',
        'warning',
      );
      return;
    }
    this.busy.set(true);
    try {
      await firstValueFrom(
        this.service.create({
          bookingId: 0,
          carId: value.carId,
          bookingDate: value.bookingDate + 'T00:00:00',
          discount: value.discount,
          totalBillAmount: value.totalBillAmount,
          customerName: customer.customerName,
          customerCity: customer.customerCity || '',
          mobileNo: customer.mobileNo || '',
          email: customer.email,
        }),
      );
      this.form.markAsPristine();
      this.busy.set(false);
      this.feedback.toast('Booking created successfully.');
      await this.router.navigateByUrl('/bookings');
    } catch (error) {
      showMutationError(this.feedback, error);
    } finally {
      this.busy.set(false);
    }
  }
}
