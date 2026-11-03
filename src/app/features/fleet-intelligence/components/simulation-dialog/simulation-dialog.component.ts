import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import type { Vehicle } from '../../../../core/models/api.models';
import { IconComponent } from '../../../../shared/icons/icon.component';

@Component({
  selector: 'app-simulation-dialog',
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './simulation-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimulationDialogComponent {
  readonly form = input.required<FormGroup>();
  readonly vehicles = input<Vehicle[]>([]);
  readonly saving = input(false);
  readonly saveRequested = output<void>();
  readonly closeRequested = output<void>();
}
