import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
import { RbacService } from '../../core/services/rbac.service';
import type { RbacRole } from '../../core/models/rbac.models';
import { PermissionService } from '../../core/services/permission.service';
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
  private readonly rbac = inject(RbacService);
  readonly permissions = inject(PermissionService);
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
  readonly availableRoles = signal<RbacRole[]>([]);
  readonly roleDrawerOpen = signal(false);
  readonly assignedRoleIds = signal<Set<string>>(new Set());
  readonly savedRoleIds = signal<Set<string>>(new Set());
  readonly rolesDirty = computed(() => {
    const current = this.assignedRoleIds();
    const saved = this.savedRoleIds();
    return current.size !== saved.size || [...current].some((id) => !saved.has(id));
  });
  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, nonBlank, Validators.maxLength(80)]],
    lastName: ['', [Validators.required, nonBlank, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', phoneValidator],
    password: [''],
    isActive: [true],
  });
  constructor() {
    void this.list.load();
  }
  async assignRoles(user: AdminUser): Promise<void> {
    this.selected.set(user);
    try {
      const roles = await firstValueFrom(this.rbac.roles());
      this.availableRoles.set(roles.filter((role) => role.isActive && role.code !== 'SUPER_ADMIN'));
      const assigned = new Set((user.roles ?? []).map((role) => role.id));
      this.assignedRoleIds.set(assigned);
      this.savedRoleIds.set(new Set(assigned));
      this.roleDrawerOpen.set(true);
    } catch (error) {
      showMutationError(this.feedback, error);
    }
  }
  toggleRole(id: string, checked: boolean): void {
    const next = new Set(this.assignedRoleIds());
    checked ? next.add(id) : next.delete(id);
    this.assignedRoleIds.set(next);
  }
  async saveRoles(): Promise<void> {
    const user = this.selected();
    if (!user || !this.assignedRoleIds().size || this.busy()) return;
    this.busy.set(true);
    try {
      await firstValueFrom(this.rbac.assignUserRoles(user.id, [...this.assignedRoleIds()]));
      this.savedRoleIds.set(new Set(this.assignedRoleIds()));
      this.feedback.toast('User roles updated successfully.');
      this.roleDrawerOpen.set(false);
      await this.list.load();
    } catch (error) {
      showMutationError(this.feedback, error);
    } finally {
      this.busy.set(false);
    }
  }
  async edit(user?: AdminUser, view = false): Promise<void> {
    if (!view && this.permissions.has('users.assign_role')) {
      try {
        const roles = await firstValueFrom(this.rbac.roles());
        this.availableRoles.set(
          roles.filter((role) => role.isActive && role.code !== 'SUPER_ADMIN'),
        );
      } catch (error) {
        showMutationError(this.feedback, error);
        return;
      }
    }
    this.selected.set(user ?? null);
    this.viewing.set(view);
    const assigned = new Set((user?.roles ?? []).map((role) => role.id));
    if (!user) {
      const staff = this.availableRoles().find((role) => role.code === 'STAFF');
      if (staff) assigned.add(staff.id);
    }
    this.assignedRoleIds.set(assigned);
    this.savedRoleIds.set(new Set(assigned));
    this.form.reset(
      user
        ? {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone ?? '',
            password: '',
            isActive: user.isActive,
          }
        : {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            password: '',
            isActive: true,
          },
    );
    this.form.controls.password.setValidators(user ? [] : [Validators.required, passwordValidator]);
    this.form.controls.password.updateValueAndValidity();
    this.open.set(true);
  }
  hasUnsavedChanges(): boolean {
    return (
      this.busy() ||
      (this.open() && !this.viewing() && (this.form.dirty || this.rolesDirty())) ||
      (this.roleDrawerOpen() && this.rolesDirty())
    );
  }
  async save(): Promise<void> {
    if (this.busy()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.assignedRoleIds().size) return;
    this.busy.set(true);
    try {
      const value = this.form.getRawValue();
      const selected = this.selected();
      const input = {
        ...value,
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        email: value.email.trim(),
        phone: value.phone || null,
        ...(selected?.role === 'SUPER_ADMIN' || !this.permissions.has('users.assign_role')
          ? {}
          : { roleIds: [...this.assignedRoleIds()] }),
      };
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
    if (action === 'view') void this.edit(user, true);
    if (action === 'edit') void this.edit(user);
    if (action === 'roles') void this.assignRoles(user);
    if (action === 'delete') void this.remove(user);
  }

  userActions(user: AdminUser): ActionMenuItem[] {
    return [
      { id: 'view', label: 'View', icon: 'view' },
      ...(this.permissions.has('users.edit')
        ? [{ id: 'edit', label: 'Edit', icon: 'edit' } as ActionMenuItem]
        : []),
      ...(this.permissions.has('users.assign_role') && user.role !== 'SUPER_ADMIN'
        ? [{ id: 'roles', label: 'Assign roles', icon: 'shield' } as ActionMenuItem]
        : []),
      ...(this.permissions.has('users.deactivate') && user.role !== 'SUPER_ADMIN'
        ? [
            {
              id: 'delete',
              label: 'Delete',
              icon: 'delete',
              destructive: true,
            } as ActionMenuItem,
          ]
        : []),
    ];
  }
}
