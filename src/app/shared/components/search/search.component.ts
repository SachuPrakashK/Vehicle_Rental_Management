import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '../../icons/icon.component';

@Component({
  selector: 'app-search',
  imports: [IconComponent],
  templateUrl: './search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent {
  readonly value = input('');
  readonly disabled = input(false);
  readonly label = input('Search');
  readonly valueChange = output<string>();

  update(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }
}
