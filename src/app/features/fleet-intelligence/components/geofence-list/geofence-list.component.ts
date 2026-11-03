import { NgClass } from '@angular/common';
import { FleetStatusPipe } from '../../fleet-status.pipe';
import { FleetStatusClassPipe } from '../../fleet-status-class.pipe';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '../../../../shared/icons/icon.component';
import type { FleetGeofence } from '../../fleet-intelligence.models';

@Component({
  selector: 'app-geofence-list',
  imports: [NgClass, FleetStatusPipe, FleetStatusClassPipe, IconComponent],
  templateUrl: './geofence-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeofenceListComponent {
  readonly geofences = input<FleetGeofence[]>([]);
  readonly canCreate = input(false);
  readonly addRequested = output<void>();
}
