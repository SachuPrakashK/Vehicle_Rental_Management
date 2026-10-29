import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { BookingService } from '../../core/services/booking.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { Booking } from '../../core/models/api.models';
import { ListState } from '../../shared/utils/list-state';
import { showMutationError } from '../../shared/utils/mutation-error';
import { IconComponent } from '../../shared/icons/icon.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { DrawerComponent } from '../../shared/components/drawer/drawer.component';
import { environment } from '../../../environments/environment';
import {
  ActionMenuComponent,
  ActionMenuItem,
} from '../../shared/components/action-menu/action-menu.component';
import { SearchComponent } from '../../shared/components/search/search.component';
@Component({
  selector: 'app-bookings',
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    IconComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    PaginationComponent,
    DrawerComponent,
    ActionMenuComponent,
    SearchComponent,
  ],
  templateUrl: './bookings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingsComponent {
  private readonly service = inject(BookingService);
  private readonly feedback = inject(FeedbackService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly dateFilter = signal('');
  readonly currency = environment.currency;
  readonly list = new ListState(
    () => this.service.list(),
    (booking, query) =>
      [
        booking.bookingUid,
        booking.bookingId,
        booking.customerName,
        booking.mobileNo,
        booking.brand,
        booking.model,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query) &&
      (!this.dateFilter() || booking.bookingDate.startsWith(this.dateFilter())),
  );
  readonly open = signal(false);
  readonly selected = signal<Booking | null>(null);
  readonly detailBusy = signal(false);
  readonly detailError = signal('');
  readonly deleting = signal<number | null>(null);
  readonly rowActions: ActionMenuItem[] = [
    { id: 'view', label: 'View', icon: 'view' },
    { id: 'delete', label: 'Delete', icon: 'delete', destructive: true },
  ];
  constructor() {
    void this.initialize();
  }
  private async initialize(): Promise<void> {
    await this.list.load();
    const id = Number(
      this.route.snapshot.paramMap.get('id') ?? this.route.snapshot.queryParamMap.get('view'),
    );
    if (id > 0) await this.view(id);
  }
  openBooking(booking: Booking, event?: Event): void {
    event?.preventDefault();
    void this.router.navigate(['/bookings', booking.bookingId]);
  }
  closeDetails(): void {
    this.open.set(false);
    if (this.route.snapshot.paramMap.has('id')) void this.router.navigate(['/bookings']);
  }
  async view(id: number): Promise<void> {
    this.open.set(true);
    this.selected.set(null);
    this.detailBusy.set(true);
    this.detailError.set('');
    try {
      const result = await firstValueFrom(this.service.get(id));
      const record = Array.isArray(result) ? result[0] : result;
      if (!record) throw new Error('Booking not found.');
      const summary = this.list.records().find((booking) => booking.bookingId === id);
      this.selected.set({ ...summary, ...record });
    } catch (error) {
      this.detailError.set(showMutationError(this.feedback, error));
    } finally {
      this.detailBusy.set(false);
    }
  }
  async remove(booking: Booking): Promise<void> {
    if (
      this.deleting() !== null ||
      !(await this.feedback.confirm(
        'Delete booking?',
        'Delete ' +
          (booking.bookingUid || '#' + booking.bookingId) +
          '? This permanently removes the booking.',
      ))
    )
      return;
    this.deleting.set(booking.bookingId);
    try {
      await firstValueFrom(this.service.delete(booking.bookingId));
      this.feedback.toast('Booking deleted successfully.');
      await this.list.load();
    } catch (error) {
      showMutationError(this.feedback, error);
    } finally {
      this.deleting.set(null);
    }
  }
  bookingAction(action: string, booking: Booking): void {
    if (action === 'view') void this.router.navigate(['/bookings', booking.bookingId]);
    if (action === 'delete') void this.remove(booking);
  }
  dateFilterLabel(): string {
    const value = this.dateFilter();
    if (!value) return 'dd-mm-yyyy';
    const [year, month, day] = value.split('-');
    return `${day}-${month}-${year}`;
  }
  openDatePicker(input: HTMLInputElement): void {
    if (typeof input.showPicker === 'function') input.showPicker();
    else input.click();
  }
}
