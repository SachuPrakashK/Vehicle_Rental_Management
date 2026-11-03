import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { FleetAnalytics, FleetForecast } from '../../fleet-intelligence.models';

@Component({
  selector: 'app-analytics-panel',
  imports: [CurrencyPipe],
  templateUrl: './analytics-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsPanelComponent {
  readonly analytics = input<FleetAnalytics[]>([]);
  readonly forecasts = input<FleetForecast[]>([]);
}
