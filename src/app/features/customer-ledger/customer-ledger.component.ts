import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CustomerService } from '../../core/services/customer.service';
import { BookingService } from '../../core/services/booking.service';
import { Customer } from '../../core/models/api.models';
import { ListState } from '../../shared/utils/list-state';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { environment } from '../../../environments/environment';
import { SearchComponent } from '../../shared/components/search/search.component';
@Component({
  selector: 'app-customer-ledger',
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    PageHeaderComponent,
    EmptyStateComponent,
    PaginationComponent,
    SearchComponent,
  ],
  templateUrl: './customer-ledger.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerLedgerComponent {
  private readonly customerService = inject(CustomerService);
  private readonly bookingService = inject(BookingService);
  private readonly destroyRef = inject(DestroyRef);
  readonly currency = environment.currency;
  readonly customers = signal<Customer[]>([]);
  readonly selectedId = signal(0);
  readonly search = signal('');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly matches = computed(() =>
    this.customers().filter((customer) =>
      [customer.customerName, customer.mobileNo, customer.email]
        .join(' ')
        .toLowerCase()
        .includes(this.search().toLowerCase()),
    ),
  );
  readonly customer = computed(() =>
    this.customers().find((customer) => customer.customerId === this.selectedId()),
  );
  readonly list = new ListState(
    () => this.bookingService.forCustomer(this.selectedId()),
    (booking, query) =>
      [booking.bookingUid, booking.bookingId, booking.brand, booking.model]
        .join(' ')
        .toLowerCase()
        .includes(query),
  );
  readonly total = computed(() =>
    this.list.records().reduce((sum, booking) => sum + booking.totalBillAmount, 0),
  );
  private readonly initialId = Number(
    inject(ActivatedRoute).snapshot.queryParamMap.get('customer'),
  );
  constructor() {
    void this.load();
  }
  async load(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    try {
      this.customers.set(
        await firstValueFrom(this.customerService.list().pipe(takeUntilDestroyed(this.destroyRef))),
      );
      if (this.customers().some((customer) => customer.customerId === this.initialId))
        await this.select(this.initialId);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to load customers.');
    } finally {
      this.loading.set(false);
    }
  }
  async select(id: number): Promise<void> {
    if (this.list.loading()) return;
    this.selectedId.set(id);
    this.list.records.set([]);
    this.list.page.set(1);
    this.list.search.set('');
    if (id) await this.list.load();
  }
}
