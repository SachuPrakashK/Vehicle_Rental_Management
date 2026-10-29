import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { FeedbackService } from '../../../../core/services/feedback.service';
import { FieldErrorComponent } from '../../../../shared/components/field-error/field-error.component';
import { IconComponent } from '../../../../shared/icons/icon.component';
import { passwordMatch, passwordValidator } from '../../../../shared/utils/validators';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';
import { PasswordFieldComponent } from '../../components/password-field/password-field.component';

@Component({
  selector: 'app-reset-password',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    FieldErrorComponent,
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
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group(
    {
      token: [this.route.snapshot.queryParamMap.get('token') ?? '', Validators.required],
      password: ['', [Validators.required, passwordValidator]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatch },
  );
  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    const value = this.form.getRawValue();
    try {
      await firstValueFrom(
        this.auth.resetPassword(value.token, value.password, value.confirmPassword),
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
