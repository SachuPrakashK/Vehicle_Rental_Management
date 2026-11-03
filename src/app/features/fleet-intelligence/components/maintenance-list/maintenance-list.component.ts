import { NgClass } from '@angular/common';
import { FleetStatusPipe } from '../../fleet-status.pipe';
import { FleetStatusClassPipe } from '../../fleet-status-class.pipe';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import {
  ActionMenuComponent,
  type ActionMenuItem,
} from '../../../../shared/components/action-menu/action-menu.component';
import { IconComponent } from '../../../../shared/icons/icon.component';
import type { MaintenanceRecord } from '../../fleet-intelligence.models';

@Component({
  selector: 'app-maintenance-list',
  imports: [
    NgClass,
    FleetStatusPipe,
    FleetStatusClassPipe,
    CurrencyPipe,
    DatePipe,
    IconComponent,
    ActionMenuComponent,
  ],
  templateUrl: './maintenance-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceListComponent {
  readonly records = input<MaintenanceRecord[]>([]);
  readonly canCreate = input(false);
  readonly canEdit = input(false);
  readonly canDelete = input(false);
  readonly addRequested = output<void>();
  readonly actionRequested = output<{ action: string; record: MaintenanceRecord }>();
  actions(record: MaintenanceRecord): ActionMenuItem[] {
    return [
      { id: 'view', label: 'View', icon: 'view' },
      ...(this.canEdit() && record.status !== 'COMPLETED'
        ? [{ id: 'edit', label: 'Edit', icon: 'edit' as const }]
        : []),
      ...(this.canDelete() && record.status !== 'COMPLETED'
        ? [{ id: 'delete', label: 'Delete', icon: 'delete' as const, destructive: true }]
        : []),
    ];
  }
}
