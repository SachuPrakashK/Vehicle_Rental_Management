import { NgClass } from '@angular/common';
import { FleetStatusPipe } from '../../fleet-status.pipe';
import { FleetStatusClassPipe } from '../../fleet-status-class.pipe';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { VehicleHealth } from '../../fleet-intelligence.models';

@Component({
  selector: 'app-health-list',
  imports: [NgClass, FleetStatusPipe, FleetStatusClassPipe],
  templateUrl: './health-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HealthListComponent {
  readonly health = input<VehicleHealth[]>([]);
}
