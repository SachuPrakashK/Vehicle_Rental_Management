import { NgClass } from '@angular/common';
import { FleetStatusPipe } from '../../fleet-status.pipe';
import { FleetStatusClassPipe } from '../../fleet-status-class.pipe';
import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { FleetAnalytics, FleetForecast } from '../../fleet-intelligence.models';
import { FleetDatePipe } from '../../fleet-date.pipe';

@Component({
  selector: 'app-analytics-panel',
  imports: [CurrencyPipe, NgClass, FleetStatusPipe, FleetStatusClassPipe, FleetDatePipe],
  templateUrl: './analytics-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsPanelComponent {
  readonly analytics = input<FleetAnalytics[]>([]);
  readonly forecasts = input<FleetForecast[]>([]);
}
