import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IconComponent } from '../../../../shared/icons/icon.component';

@Component({
  selector: 'app-geofence-dialog',
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './geofence-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeofenceDialogComponent {
  readonly form = input.required<FormGroup>();
  readonly saving = input(false);
  readonly saveRequested = output<void>();
  readonly closeRequested = output<void>();
}
