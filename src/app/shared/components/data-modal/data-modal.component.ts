import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { IconComponent } from '../../icons/icon.component';
import { ModalComponent } from '../modal/modal.component';

export interface DataModalColumn {
  key: string;
  label: string;
  format?: 'currency' | 'number';
}

export type DataModalRow = Record<string, string | number>;

@Component({
  selector: 'app-data-modal',
  imports: [CurrencyPipe, DecimalPipe, IconComponent, ModalComponent],
  templateUrl: './data-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataModalComponent {
  readonly open = input(false);
  readonly title = input('Data');
  readonly columns = input.required<DataModalColumn[]>();
  readonly rows = input.required<DataModalRow[]>();
  readonly currency = input('INR');
  readonly closed = output<void>();
  close(): void {
    this.closed.emit();
  }
}
