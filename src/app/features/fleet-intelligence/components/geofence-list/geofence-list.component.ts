import { NgClass } from '@angular/common';
import { FleetStatusPipe } from '../../fleet-status.pipe';
import { FleetStatusClassPipe } from '../../fleet-status-class.pipe';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  ActionMenuComponent,
  type ActionMenuItem,
} from '../../../../shared/components/action-menu/action-menu.component';
import { IconComponent } from '../../../../shared/icons/icon.component';
import type { FleetGeofence } from '../../fleet-intelligence.models';

@Component({
  selector: 'app-geofence-list',
  imports: [NgClass, FleetStatusPipe, FleetStatusClassPipe, IconComponent, ActionMenuComponent],
  templateUrl: './geofence-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeofenceListComponent {
  readonly geofences = input<FleetGeofence[]>([]);
  readonly canCreate = input(false);
  readonly canEdit = input(false);
  readonly canDelete = input(false);
  readonly addRequested = output<void>();
  readonly actionRequested = output<{ action: string; geofence: FleetGeofence }>();
  readonly actions = computed<ActionMenuItem[]>(() => [
    { id: 'view', label: 'View', icon: 'view' },
    ...(this.canEdit() ? [{ id: 'edit', label: 'Edit', icon: 'edit' as const }] : []),
    ...(this.canDelete()
      ? [{ id: 'delete', label: 'Delete', icon: 'delete' as const, destructive: true }]
      : []),
  ]);
}
