import { NgClass } from '@angular/common';
import { FleetStatusPipe } from '../../fleet-status.pipe';
import { FleetStatusClassPipe } from '../../fleet-status-class.pipe';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { FleetAlert } from '../../fleet-intelligence.models';

@Component({
  selector: 'app-alert-list',
  imports: [NgClass, FleetStatusPipe, FleetStatusClassPipe, DatePipe],
  templateUrl: './alert-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertListComponent {
  readonly alerts = input<FleetAlert[]>([]);
  readonly canAcknowledge = input(false);
  readonly acknowledgeRequested = output<FleetAlert>();
}
