import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { FeedbackService } from '../../../../core/services/feedback.service';
import { FieldErrorComponent } from '../../../../shared/components/field-error/field-error.component';
import { IconComponent } from '../../../../shared/icons/icon.component';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';
import { PasswordFieldComponent } from '../../components/password-field/password-field.component';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    FieldErrorComponent,
    IconComponent,
    AuthLayoutComponent,
    PasswordFieldComponent,
  ],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly feedback = inject(FeedbackService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.auth.login(this.form.getRawValue()));
      this.feedback.toast('Welcome back.');
      await this.router.navigateByUrl(
        this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard',
      );
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      this.busy.set(false);
      this.form.controls.password.reset();
    }
  }
}
