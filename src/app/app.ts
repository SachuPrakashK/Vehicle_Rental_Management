import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FeedbackComponent } from './shared/components/feedback/feedback.component';

@Component({
  imports: [RouterOutlet, FeedbackComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {}
