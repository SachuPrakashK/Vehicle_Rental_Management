import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { VehicleHealth } from '../../fleet-intelligence.models';

@Component({
  selector: 'app-health-list',
  templateUrl: './health-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HealthListComponent {
  readonly health = input<VehicleHealth[]>([]);
}
