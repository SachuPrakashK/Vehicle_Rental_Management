import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AdminUserService } from '../../core/services/admin-user.service';
import { FeedbackService } from '../../core/services/feedback.service';
import type { AdminUser } from '../../core/models/api.models';
import { ListState } from '../../shared/utils/list-state';
import { nonBlank, passwordValidator, phoneValidator } from '../../shared/utils/validators';
import { showMutationError } from '../../shared/utils/mutation-error';
import { IconComponent } from '../../shared/icons/icon.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { DrawerComponent } from '../../shared/components/drawer/drawer.component';
import { FieldErrorComponent } from '../../shared/components/field-error/field-error.component';
import {
  ActionMenuComponent,
  ActionMenuItem,
} from '../../shared/components/action-menu/action-menu.component';
import { SearchComponent } from '../../shared/components/search/search.component';
@Component({
  selector: 'app-admin-users',
  imports: [
    ReactiveFormsModule,
    IconComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    PaginationComponent,
    DrawerComponent,
    FieldErrorComponent,
    ActionMenuComponent,
    SearchComponent,
  ],
  templateUrl: './admin-users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersComponent {
  private readonly service = inject(AdminUserService);
  private readonly feedback = inject(FeedbackService);
  private readonly fb = inject(FormBuilder);
  readonly list = new ListState(
    () => this.service.list(),
    (user, query) =>
      [user.firstName, user.lastName, user.email, user.phone, user.role]
        .join(' ')
        .toLowerCase()
        .includes(query),
  );
  readonly open = signal(false);
  readonly viewing = signal(false);
  readonly selected = signal<AdminUser | null>(null);
  readonly busy = signal(false);
  readonly deleting = signal<string | null>(null);
  readonly rowActions: ActionMenuItem[] = [
    { id: 'view', label: 'View', icon: 'view' },
    { id: 'edit', label: 'Edit', icon: 'edit' },
    { id: 'delete', label: 'Delete', icon: 'delete', destructive: true },
  ];
  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, nonBlank, Validators.maxLength(80)]],
    lastName: ['', [Validators.required, nonBlank, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', phoneValidator],
    password: [''],
    role: this.fb.nonNullable.control<AdminUser['role']>('STAFF'),
    isActive: [true],
  });
  constructor() {
    void this.list.load();
  }
  edit(user?: AdminUser, view = false): void {
    this.selected.set(user ?? null);
    this.viewing.set(view);
    this.form.reset(
      user
        ? {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone ?? '',
            password: '',
            role: user.role,
            isActive: user.isActive,
          }
        : {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            password: '',
            role: 'STAFF',
            isActive: true,
          },
    );
    this.form.controls.password.setValidators(user ? [] : [Validators.required, passwordValidator]);
    this.form.controls.password.updateValueAndValidity();
    this.open.set(true);
  }
  hasUnsavedChanges(): boolean {
    return this.busy() || (this.open() && !this.viewing() && this.form.dirty);
  }
  async save(): Promise<void> {
    if (this.busy()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.busy.set(true);
    try {
      const value = this.form.getRawValue();
      const input = {
        ...value,
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        email: value.email.trim(),
        phone: value.phone || null,
      };
      const selected = this.selected();
      await firstValueFrom(
        selected ? this.service.update(selected.id, input) : this.service.create(input),
      );
      this.feedback.toast(
        selected ? 'Admin user updated successfully.' : 'Admin user created successfully.',
      );
      this.form.markAsPristine();
      this.open.set(false);
      await this.list.load();
    } catch (error) {
      showMutationError(this.feedback, error);
    } finally {
      this.busy.set(false);
    }
  }
  async remove(user: AdminUser): Promise<void> {
    if (
      this.deleting() ||
      !(await this.feedback.confirm(
        'Delete admin user?',
        'Permanently delete ' + user.firstName + ' ' + user.lastName + '?',
      ))
    )
      return;
    this.deleting.set(user.id);
    try {
      await firstValueFrom(this.service.delete(user.id));
      this.feedback.toast('Admin user deleted successfully.');
      await this.list.load();
    } catch (error) {
      showMutationError(this.feedback, error);
    } finally {
      this.deleting.set(null);
    }
  }
  userAction(action: string, user: AdminUser): void {
    if (action === 'view') this.edit(user, true);
    if (action === 'edit') this.edit(user);
    if (action === 'delete') void this.remove(user);
  }
}
