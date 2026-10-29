import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DashboardData } from '../../../../core/models/api.models';
import { IconComponent } from '../../../../shared/icons/icon.component';

@Component({
  selector: 'app-dashboard-statistics',
  imports: [CurrencyPipe, DecimalPipe, IconComponent],
  templateUrl: './dashboard-statistics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardStatisticsComponent {
  readonly data = input.required<DashboardData>();
  readonly vehicleCount = input.required<number>();
  readonly currency = input.required<string>();
}
