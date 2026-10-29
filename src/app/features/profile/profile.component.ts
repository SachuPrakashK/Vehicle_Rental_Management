import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { FeedbackService } from '../../core/services/feedback.service';
import {
  nonBlank,
  passwordMatch,
  passwordValidator,
  phoneValidator,
} from '../../shared/utils/validators';
import { showMutationError } from '../../shared/utils/mutation-error';
import { IconComponent } from '../../shared/icons/icon.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FieldErrorComponent } from '../../shared/components/field-error/field-error.component';
@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, IconComponent, PageHeaderComponent, FieldErrorComponent],
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  readonly service = inject(ProfileService);
  private readonly auth = inject(AuthService);
  private readonly feedback = inject(FeedbackService);
  private readonly fb = inject(FormBuilder);
  readonly imageBusy = signal(false);
  readonly saving = signal(false);
  readonly passwordBusy = signal(false);
  private readonly user = this.service.profile()!;
  readonly form = this.fb.nonNullable.group({
    firstName: [this.user.firstName, [Validators.required, nonBlank, Validators.maxLength(80)]],
    lastName: [this.user.lastName, [Validators.required, nonBlank, Validators.maxLength(80)]],
    email: [{ value: this.user.email, disabled: true }],
    phone: [this.user.phone ?? '', phoneValidator],
  });
  readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      password: ['', [Validators.required, passwordValidator]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatch },
  );
  hasUnsavedChanges(): boolean {
    return (
      this.form.dirty ||
      this.passwordForm.dirty ||
      this.imageBusy() ||
      this.saving() ||
      this.passwordBusy()
    );
  }
  async save(): Promise<void> {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true);
    try {
      const value = this.form.getRawValue();
      await firstValueFrom(
        this.service.update({
          firstName: value.firstName.trim(),
          lastName: value.lastName.trim(),
          phone: value.phone || null,
        }),
      );
      this.form.markAsPristine();
      this.feedback.toast('Profile updated successfully.');
    } catch (error) {
      showMutationError(this.feedback, error);
    } finally {
      this.saving.set(false);
    }
  }
  async upload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || this.imageBusy()) return;
    this.imageBusy.set(true);
    try {
      await firstValueFrom(this.service.updateImage(file));
      this.feedback.toast('Profile image updated successfully.');
    } catch (error) {
      showMutationError(this.feedback, error);
    } finally {
      this.imageBusy.set(false);
      input.value = '';
    }
  }
  async deleteImage(): Promise<void> {
    if (
      this.imageBusy() ||
      !(await this.feedback.confirm('Delete profile image?', 'Remove your profile image?'))
    )
      return;
    this.imageBusy.set(true);
    try {
      await firstValueFrom(this.service.deleteImage());
      this.feedback.toast('Profile image deleted.');
    } catch (error) {
      showMutationError(this.feedback, error);
    } finally {
      this.imageBusy.set(false);
    }
  }
  async changePassword(): Promise<void> {
    if (this.passwordBusy()) return;
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid) return;
    this.passwordBusy.set(true);
    try {
      const value = this.passwordForm.getRawValue();
      await firstValueFrom(
        this.auth.changePassword(value.currentPassword, value.password, value.confirmPassword),
      );
      this.passwordForm.markAsPristine();
      this.feedback.toast('Password changed. Please sign in again.');
      await this.auth.logout();
    } catch (error) {
      showMutationError(this.feedback, error);
    } finally {
      this.passwordBusy.set(false);
    }
  }
}
