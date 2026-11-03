import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '../../../../shared/icons/icon.component';
import type { FleetCapabilities, TrackingStatus } from '../../fleet-intelligence.models';
import { FleetMapComponent } from '../../fleet-map.component';

@Component({
  selector: 'app-tracking-panel',
  imports: [IconComponent, FleetMapComponent],
  templateUrl: './tracking-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackingPanelComponent {
  readonly tracking = input<TrackingStatus | null>(null);
  readonly capabilities = input<FleetCapabilities | null>(null);
  readonly canSimulate = input(false);
  readonly simulationRequested = output<void>();
}
