import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '../../../../shared/icons/icon.component';
import type { FleetGeofence } from '../../fleet-intelligence.models';

@Component({
  selector: 'app-geofence-list',
  imports: [IconComponent],
  templateUrl: './geofence-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeofenceListComponent {
  readonly geofences = input<FleetGeofence[]>([]);
  readonly canCreate = input(false);
  readonly addRequested = output<void>();
}
