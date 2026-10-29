import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Booking } from '../../../../core/models/api.models';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../../shared/icons/icon.component';

@Component({
  selector: 'app-recent-bookings',
  imports: [CurrencyPipe, DatePipe, RouterLink, EmptyStateComponent, IconComponent],
  templateUrl: './recent-bookings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentBookingsComponent {
  readonly bookings = input.required<Booking[]>();
  readonly currency = input.required<string>();
  readonly recent = computed(() =>
    [...this.bookings()]
      .sort((a, b) => Date.parse(b.bookingDate) - Date.parse(a.bookingDate))
      .slice(0, 5),
  );
}
