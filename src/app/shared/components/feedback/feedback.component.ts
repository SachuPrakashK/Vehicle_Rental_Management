import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { FeedbackService } from '../../../core/services/feedback.service';
import { IconComponent } from '../../icons/icon.component';
@Component({
  selector: 'app-feedback',
  imports: [IconComponent],
  templateUrl: './feedback.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackComponent {
  readonly feedback = inject(FeedbackService);
  readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  constructor() {
    effect(() => {
      const dialog = this.dialog()?.nativeElement;
      if (this.feedback.confirmation() && typeof dialog?.showModal === 'function')
        dialog.showModal();
      else if (!this.feedback.confirmation() && typeof dialog?.close === 'function') dialog.close();
    });
  }
}
