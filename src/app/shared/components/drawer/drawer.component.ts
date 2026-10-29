import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { FeedbackService } from '../../../core/services/feedback.service';
import { IconComponent } from '../../icons/icon.component';
@Component({
  selector: 'app-drawer',
  imports: [IconComponent],
  templateUrl: './drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerComponent {
  readonly title = input.required<string>();
  readonly open = input(false);
  readonly dirty = input(false);
  readonly busy = input(false);
  readonly closed = output<void>();
  readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private readonly feedback = inject(FeedbackService);
  constructor() {
    effect(() => {
      const dialog = this.dialog()?.nativeElement;
      if (this.open() && typeof dialog?.showModal === 'function') dialog.showModal();
      else if (!this.open() && typeof dialog?.close === 'function') dialog.close();
    });
  }
  async close(): Promise<void> {
    if (this.busy()) return;
    if (
      this.dirty() &&
      !(await this.feedback.confirm(
        'Discard changes?',
        'Your unsaved changes will be lost.',
        'Discard',
      ))
    )
      return;
    this.closed.emit();
  }
  backdrop(event: MouseEvent): void {
    if (event.target === this.dialog()?.nativeElement) {
      const rect = this.dialog()!.nativeElement.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right) void this.close();
    }
  }
}
