import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { FeedbackService } from '../../../../core/services/feedback.service';
import { FieldErrorComponent } from '../../../../shared/components/field-error/field-error.component';
import { IconComponent } from '../../../../shared/icons/icon.component';
import {
  nonBlank,
  passwordMatch,
  passwordValidator,
  phoneValidator,
} from '../../../../shared/utils/validators';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';
import { PasswordFieldComponent } from '../../components/password-field/password-field.component';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    FieldErrorComponent,
    IconComponent,
    AuthLayoutComponent,
    PasswordFieldComponent,
  ],
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly feedback = inject(FeedbackService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group(
    {
      firstName: ['', [Validators.required, nonBlank, Validators.maxLength(80)]],
      lastName: ['', [Validators.required, nonBlank, Validators.maxLength(80)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', phoneValidator],
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
        this.auth.register({
          ...value,
          firstName: value.firstName.trim(),
          lastName: value.lastName.trim(),
        }),
      );
      this.feedback.toast('Account created successfully. Please sign in.');
      await this.router.navigateByUrl('/auth/login');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to create your account.');
    } finally {
      this.busy.set(false);
      this.form.controls.password.reset();
      this.form.controls.confirmPassword.reset();
    }
  }
}
