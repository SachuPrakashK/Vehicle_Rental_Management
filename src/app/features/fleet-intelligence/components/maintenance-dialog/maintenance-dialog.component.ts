import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import type { Vehicle } from '../../../../core/models/api.models';
import { IconComponent } from '../../../../shared/icons/icon.component';
import { DatePickerComponent } from '../../../../shared/components/date-picker/date-picker.component';

@Component({
  selector: 'app-maintenance-dialog',
  imports: [ReactiveFormsModule, IconComponent, DatePickerComponent],
  templateUrl: './maintenance-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceDialogComponent {
  readonly form = input.required<FormGroup>();
  readonly vehicles = input<Vehicle[]>([]);
  readonly saving = input(false);
  readonly saveRequested = output<void>();
  readonly closeRequested = output<void>();
}
