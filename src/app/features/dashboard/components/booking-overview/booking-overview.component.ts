import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { Booking } from '../../../../core/models/api.models';
import {
  DataModalColumn,
  DataModalComponent,
  DataModalRow,
} from '../../../../shared/components/data-modal/data-modal.component';
import { BookingChartComponent, ChartPoint } from '../../booking-chart.component';
import {
  CustomPeriodModalComponent,
  CustomPeriodRange,
} from '../custom-period-modal/custom-period-modal.component';

type DashboardPeriod = '3' | '6' | '12' | 'this-year' | 'previous-year' | 'custom';

@Component({
  selector: 'app-booking-overview',
  imports: [BookingChartComponent, DataModalComponent, CustomPeriodModalComponent],
  templateUrl: './booking-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingOverviewComponent {
  readonly bookings = input.required<Booking[]>();
  readonly currency = input.required<string>();
  readonly period = signal<DashboardPeriod>('6');
  readonly customRange = signal<CustomPeriodRange | null>(null);
  readonly dataModalOpen = signal(false);
  readonly customPeriodOpen = signal(false);
  readonly periodOptions: { value: DashboardPeriod; label: string }[] = [
    { value: '3', label: 'Last 3 months' },
    { value: '6', label: 'Last 6 months' },
    { value: '12', label: 'Last 12 months' },
    { value: 'this-year', label: 'This Year' },
    { value: 'previous-year', label: 'Previous Year' },
    { value: 'custom', label: 'Custom Period' },
  ];
  readonly modalColumns: DataModalColumn[] = [
    { key: 'month', label: 'Month' },
    { key: 'bookings', label: 'Bookings', format: 'number' },
    { key: 'amount', label: 'Billed amount', format: 'currency' },
  ];
  readonly periodLabel = computed(() => {
    const range = this.customRange();
    if (this.period() === 'custom' && range) {
      const format = (value: string) =>
        new Date(value + 'T00:00:00').toLocaleDateString('en', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      return `${format(range.from)} – ${format(range.to)}`;
    }
    return this.periodOptions.find((option) => option.value === this.period())?.label ?? '';
  });
  readonly periodRange = computed(() => {
    const now = new Date();
    const period = this.period();
    if (period === 'custom') {
      const range = this.customRange();
      if (!range) return null;
      return { start: new Date(range.from + 'T00:00:00'), end: new Date(range.to + 'T23:59:59') };
    }
    if (period === 'this-year')
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
      };
    if (period === 'previous-year')
      return {
        start: new Date(now.getFullYear() - 1, 0, 1),
        end: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59),
      };
    const months = Number(period);
    return {
      start: new Date(now.getFullYear(), now.getMonth() - months + 1, 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    };
  });
  readonly periodBookings = computed(() => {
    const range = this.periodRange();
    if (!range) return [];
    return this.bookings().filter((booking) => {
      const date = new Date(booking.bookingDate);
      return date >= range.start && date <= range.end;
    });
  });
  readonly chartData = computed<ChartPoint[]>(() => {
    const range = this.periodRange();
    if (!range) return [];
    const monthCount =
      (range.end.getFullYear() - range.start.getFullYear()) * 12 +
      range.end.getMonth() -
      range.start.getMonth() +
      1;
    return Array.from({ length: Math.max(0, monthCount) }, (_, index) => {
      const date = new Date(range.start.getFullYear(), range.start.getMonth() + index, 1);
      const bookings = this.periodBookings().filter((booking) => {
        const value = new Date(booking.bookingDate);
        return value.getFullYear() === date.getFullYear() && value.getMonth() === date.getMonth();
      });
      return {
        month: date.toLocaleDateString('en', { month: 'short', year: 'numeric' }),
        bookings: bookings.length,
        amount: bookings.reduce((sum, booking) => sum + booking.totalBillAmount, 0),
      };
    });
  });
  readonly modalRows = computed<DataModalRow[]>(() =>
    this.chartData().map((point) => ({
      month: point.month,
      bookings: point.bookings,
      amount: point.amount,
    })),
  );

  changePeriod(select: HTMLSelectElement): void {
    const value = select.value as DashboardPeriod;
    if (value === 'custom') {
      select.value = this.period();
      this.customPeriodOpen.set(true);
      return;
    }
    this.period.set(value);
    this.customRange.set(null);
  }

  applyCustomPeriod(range: CustomPeriodRange): void {
    this.customRange.set(range);
    this.period.set('custom');
    this.customPeriodOpen.set(false);
  }
}
