import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AuthVisualComponent } from '../auth-visual/auth-visual.component';

@Component({
  selector: 'app-auth-layout',
  imports: [AuthVisualComponent],
  templateUrl: './auth-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayoutComponent {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
}
