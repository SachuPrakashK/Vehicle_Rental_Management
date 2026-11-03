import { NgClass } from '@angular/common';
import { FleetStatusPipe } from '../../fleet-status.pipe';
import { FleetStatusClassPipe } from '../../fleet-status-class.pipe';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '../../../../shared/icons/icon.component';
import type { MaintenanceRecord } from '../../fleet-intelligence.models';

@Component({
  selector: 'app-maintenance-list',
  imports: [NgClass, FleetStatusPipe, FleetStatusClassPipe, CurrencyPipe, DatePipe, IconComponent],
  templateUrl: './maintenance-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceListComponent {
  readonly records = input<MaintenanceRecord[]>([]);
  readonly canCreate = input(false);
  readonly addRequested = output<void>();
}
