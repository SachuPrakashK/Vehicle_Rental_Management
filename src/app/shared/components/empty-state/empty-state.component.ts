import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '../../icons/icon.component';
@Component({
  selector: 'app-empty-state',
  imports: [IconComponent],
  templateUrl: './empty-state.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly title = input('No data found');
  readonly description = input('Records will appear here when they are added.');
  readonly actionLabel = input('');
  readonly action = output<void>();
}
