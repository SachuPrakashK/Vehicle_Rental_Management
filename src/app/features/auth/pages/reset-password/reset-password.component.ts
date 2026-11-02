import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { FeedbackService } from '../../../../core/services/feedback.service';
import { IconComponent } from '../../../../shared/icons/icon.component';
import { passwordMatch, passwordValidator } from '../../../../shared/utils/validators';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';
import { PasswordFieldComponent } from '../../components/password-field/password-field.component';

@Component({
  selector: 'app-reset-password',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IconComponent,
    AuthLayoutComponent,
    PasswordFieldComponent,
  ],
  templateUrl: './reset-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly feedback = inject(FeedbackService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  readonly busy = signal(false);
  readonly verifying = signal(true);
  readonly tokenValid = signal(false);
  readonly error = signal('');
  readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';
  readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, passwordValidator]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatch },
  );
  constructor() {
    void this.verifyToken();
  }
  private async verifyToken(): Promise<void> {
    if (!this.token) {
      this.error.set('This password reset link is invalid or has expired.');
      this.verifying.set(false);
      return;
    }
    try {
      await firstValueFrom(this.auth.verifyResetToken(this.token));
      this.tokenValid.set(true);
    } catch {
      this.error.set('This password reset link is invalid or has expired.');
    } finally {
      this.verifying.set(false);
    }
  }
  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    const value = this.form.getRawValue();
    try {
      await firstValueFrom(
        this.auth.resetPassword(this.token, value.password, value.confirmPassword),
      );
      this.feedback.toast('Password reset successfully. Please sign in.');
      await this.router.navigateByUrl('/auth/login');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to reset your password.');
    } finally {
      this.busy.set(false);
      this.form.controls.password.reset();
      this.form.controls.confirmPassword.reset();
    }
  }
}
