import { NgClass } from '@angular/common';
import { FleetStatusPipe } from '../../fleet-status.pipe';
import { FleetStatusClassPipe } from '../../fleet-status-class.pipe';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/icons/icon.component';
import type { FleetOverview } from '../../fleet-intelligence.models';

@Component({
  selector: 'app-fleet-overview',
  imports: [NgClass, FleetStatusPipe, FleetStatusClassPipe, DatePipe, RouterLink, IconComponent],
  templateUrl: './fleet-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FleetOverviewComponent {
  readonly overview = input<FleetOverview | null>(null);
  readonly canViewMaintenance = input(false);
  readonly canViewHealth = input(false);
}
