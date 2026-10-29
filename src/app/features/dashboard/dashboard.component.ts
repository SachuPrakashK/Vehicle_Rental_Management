import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom, forkJoin } from 'rxjs';
import { Booking, DashboardData } from '../../core/models/api.models';
import { BookingService } from '../../core/services/booking.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { IconComponent } from '../../shared/icons/icon.component';
import { environment } from '../../../environments/environment';
import { BookingOverviewComponent } from './components/booking-overview/booking-overview.component';
import { DashboardStatisticsComponent } from './components/dashboard-statistics/dashboard-statistics.component';
import { RecentBookingsComponent } from './components/recent-bookings/recent-bookings.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    IconComponent,
    BookingOverviewComponent,
    DashboardStatisticsComponent,
    RecentBookingsComponent,
  ],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly service = inject(DashboardService);
  private readonly bookingService = inject(BookingService);
  private readonly vehicleService = inject(VehicleService);
  private readonly destroyRef = inject(DestroyRef);
  readonly data = signal<DashboardData | null>(null);
  readonly bookings = signal<Booking[]>([]);
  readonly vehicleCount = signal(0);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly currency = environment.currency;

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const data = await firstValueFrom(
        forkJoin({
          stats: this.service.get(),
          bookings: this.bookingService.list(),
          vehicles: this.vehicleService.list(),
        }).pipe(takeUntilDestroyed(this.destroyRef)),
      );
      this.data.set(data.stats);
      this.bookings.set(data.bookings);
      this.vehicleCount.set(data.vehicles.length);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to load dashboard.');
    } finally {
      this.busy.set(false);
    }
  }
}
