import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { IconComponent } from '../../icons/icon.component';

@Component({
  selector: 'app-modal',
  imports: [IconComponent],
  templateUrl: './modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {
  readonly open = input(false);
  readonly title = input('Dialog');
  readonly closeLabel = input('Close dialog');
  readonly compact = input(false);
  readonly closed = output<void>();
  readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const dialog = this.dialog()?.nativeElement;
      if (this.open() && dialog && !dialog.open) dialog.showModal();
      if (!this.open() && dialog?.open) dialog.close();
    });
  }

  close(): void {
    this.closed.emit();
  }
}
