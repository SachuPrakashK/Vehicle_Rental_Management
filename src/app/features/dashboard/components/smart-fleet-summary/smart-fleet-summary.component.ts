import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/icons/icon.component';
import type { FleetOverview } from '../../../fleet-intelligence/fleet-intelligence.models';

@Component({
  selector: 'app-smart-fleet-summary',
  imports: [DatePipe, RouterLink, IconComponent],
  templateUrl: './smart-fleet-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartFleetSummaryComponent {
  readonly overview = input<FleetOverview | null>(null);
  readonly loading = input(false);
  readonly error = input('');
  readonly canViewMaintenance = input(false);
  readonly canViewAlerts = input(false);
  readonly canViewHealth = input(false);
}
