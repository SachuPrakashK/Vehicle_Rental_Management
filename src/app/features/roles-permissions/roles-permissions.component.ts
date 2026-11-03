import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import type { Permission, RbacRole } from '../../core/models/rbac.models';
import { PermissionService } from '../../core/services/permission.service';
import { RbacService } from '../../core/services/rbac.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { DrawerComponent } from '../../shared/components/drawer/drawer.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { FieldErrorComponent } from '../../shared/components/field-error/field-error.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SearchComponent } from '../../shared/components/search/search.component';
import { IconComponent } from '../../shared/icons/icon.component';
import { showMutationError } from '../../shared/utils/mutation-error';
import { nonBlank } from '../../shared/utils/validators';

type PermissionFilter = 'all' | 'selected' | 'unselected';

interface PermissionGroup {
  module: string;
  items: Permission[];
  allItems: Permission[];
  total: number;
}

const sameSelection = (first: Set<string>, second: Set<string>): boolean =>
  first.size === second.size && [...first].every((id) => second.has(id));

@Component({
  selector: 'app-roles-permissions',
  imports: [
    ReactiveFormsModule,
    DrawerComponent,
    EmptyStateComponent,
    FieldErrorComponent,
    PageHeaderComponent,
    SearchComponent,
    IconComponent,
  ],
  templateUrl: './roles-permissions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesPermissionsComponent {
  private readonly service = inject(RbacService);
  private readonly feedback = inject(FeedbackService);
  private readonly fb = inject(FormBuilder);
  readonly access = inject(PermissionService);
  readonly roles = signal<RbacRole[]>([]);
  readonly permissions = signal<Permission[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly search = signal('');
  readonly selected = signal<RbacRole | null>(null);
  readonly drawerOpen = signal(false);
  readonly matrixOpen = signal(false);
  readonly selectedPermissionIds = signal<Set<string>>(new Set());
  readonly savedPermissionIds = signal<Set<string>>(new Set());
  readonly permissionSearch = signal('');
  readonly permissionFilter = signal<PermissionFilter>('all');
  readonly expandedModules = signal<Set<string>>(new Set());
  readonly permissionDrawer = viewChild<DrawerComponent>('permissionDrawer');
  readonly filteredRoles = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.roles().filter(
      (role) =>
        !query || [role.name, role.code, role.description].join(' ').toLowerCase().includes(query),
    );
  });
  readonly permissionGroups = computed(() => {
    const groups = new Map<string, Permission[]>();
    for (const permission of this.permissions())
      groups.set(permission.module, [...(groups.get(permission.module) ?? []), permission]);
    return [...groups.entries()].map(([module, items]) => ({ module, items, total: items.length }));
  });
  readonly visiblePermissionGroups = computed<PermissionGroup[]>(() => {
    const query = this.permissionSearch().trim().toLowerCase();
    const filter = this.permissionFilter();
    return this.permissionGroups()
      .map((group) => ({
        ...group,
        allItems: group.items,
        items: group.items.filter((permission) => {
          const selected = this.checked(permission.id);
          const matchesFilter = filter === 'all' || (filter === 'selected' ? selected : !selected);
          const matchesSearch =
            !query ||
            group.module.toLowerCase().includes(query) ||
            permission.action.toLowerCase().includes(query) ||
            permission.code.toLowerCase().includes(query) ||
            permission.description.toLowerCase().includes(query);
          return matchesFilter && matchesSearch;
        }),
      }))
      .filter((group) => group.items.length);
  });
  readonly permissionsReadOnly = computed(
    () => this.selected()?.code === 'SUPER_ADMIN' || !this.access.has('roles.assign_permissions'),
  );
  readonly permissionsReadOnlyMessage = computed(() =>
    this.selected()?.code === 'SUPER_ADMIN'
      ? 'Super Admin permissions are protected and shown as read-only.'
      : 'You can review these permissions, but your role cannot change them.',
  );
  readonly permissionsDirty = computed(
    () => !sameSelection(this.selectedPermissionIds(), this.savedPermissionIds()),
  );
  readonly allSelected = computed(
    () =>
      !!this.permissions().length &&
      this.permissions().every((permission) => this.checked(permission.id)),
  );
  readonly someSelected = computed(
    () => this.selectedPermissionIds().size > 0 && !this.allSelected(),
  );
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, nonBlank, Validators.maxLength(80)]],
    code: ['', [Validators.required, Validators.pattern(/^[A-Z][A-Z0-9_]{1,79}$/)]],
    description: ['', Validators.maxLength(300)],
    isActive: [true],
  });

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [roles, permissions] = await Promise.all([
        firstValueFrom(this.service.roles()),
        firstValueFrom(this.service.permissions()),
      ]);
      this.roles.set(roles);
      this.permissions.set(permissions);
    } catch (error) {
      showMutationError(this.feedback, error);
    } finally {
      this.loading.set(false);
    }
  }

  edit(role?: RbacRole): void {
    this.selected.set(role ?? null);
    this.form.reset({
      name: role?.name ?? '',
      code: role?.code ?? '',
      description: role?.description ?? '',
      isActive: role?.isActive ?? true,
    });
    role ? this.form.controls.code.disable() : this.form.controls.code.enable();
    this.drawerOpen.set(true);
  }

  async save(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    try {
      const value = this.form.getRawValue();
      const selected = this.selected();
      if (selected)
        await firstValueFrom(
          this.service.update(selected.id, { ...value, version: selected.version }),
        );
      else await firstValueFrom(this.service.create(value));
      this.feedback.toast(selected ? 'Role updated successfully.' : 'Role created successfully.');
      this.form.markAsPristine();
      this.drawerOpen.set(false);
      await this.load();
    } catch (error) {
      showMutationError(this.feedback, error);
    } finally {
      this.busy.set(false);
    }
  }

  editPermissions(role: RbacRole): void {
    this.selected.set(role);
    const selected = new Set(role.permissions.map((permission) => permission.id));
    this.selectedPermissionIds.set(selected);
    this.savedPermissionIds.set(new Set(selected));
    this.permissionSearch.set('');
    this.permissionFilter.set('all');
    this.expandedModules.set(new Set(this.permissionGroups().map((group) => group.module)));
    this.matrixOpen.set(true);
  }

  checked(id: string): boolean {
    return this.selectedPermissionIds().has(id);
  }
  toggle(id: string, checked: boolean): void {
    if (this.permissionsReadOnly()) return;
    const next = new Set(this.selectedPermissionIds());
    checked ? next.add(id) : next.delete(id);
    this.selectedPermissionIds.set(next);
  }
  toggleModule(items: Permission[], checked: boolean): void {
    if (this.permissionsReadOnly()) return;
    const next = new Set(this.selectedPermissionIds());
    for (const item of items) checked ? next.add(item.id) : next.delete(item.id);
    this.selectedPermissionIds.set(next);
  }

  toggleAll(checked: boolean): void {
    if (this.permissionsReadOnly()) return;
    this.selectedPermissionIds.set(
      checked ? new Set(this.permissions().map((permission) => permission.id)) : new Set(),
    );
  }

  moduleSelectedCount(group: PermissionGroup): number {
    return group.allItems.filter((permission) => this.checked(permission.id)).length;
  }

  moduleAllSelected(group: PermissionGroup): boolean {
    return (
      !!group.allItems.length && group.allItems.every((permission) => this.checked(permission.id))
    );
  }

  modulePartiallySelected(group: PermissionGroup): boolean {
    const count = this.moduleSelectedCount(group);
    return count > 0 && count < group.allItems.length;
  }

  isExpanded(module: string): boolean {
    return this.expandedModules().has(module);
  }

  toggleExpanded(module: string): void {
    const expanded = new Set(this.expandedModules());
    expanded.has(module) ? expanded.delete(module) : expanded.add(module);
    this.expandedModules.set(expanded);
  }

  expandAll(): void {
    this.expandedModules.set(new Set(this.permissionGroups().map((group) => group.module)));
  }

  collapseAll(): void {
    this.expandedModules.set(new Set());
  }

  resetPermissionChanges(): void {
    this.selectedPermissionIds.set(new Set(this.savedPermissionIds()));
  }

  closePermissions(): void {
    this.resetPermissionChanges();
    this.matrixOpen.set(false);
  }

  clearPermissionSearch(): void {
    this.permissionSearch.set('');
    this.permissionFilter.set('all');
  }

  async savePermissions(): Promise<void> {
    const role = this.selected();
    if (!role || this.busy() || this.permissionsReadOnly() || !this.permissionsDirty()) return;
    this.busy.set(true);
    try {
      await firstValueFrom(
        this.service.updatePermissions(role.id, [...this.selectedPermissionIds()], role.version),
      );
      this.feedback.toast('Role permissions updated successfully.');
      this.savedPermissionIds.set(new Set(this.selectedPermissionIds()));
      this.matrixOpen.set(false);
      await this.load();
    } catch (error) {
      showMutationError(this.feedback, error);
    } finally {
      this.busy.set(false);
    }
  }

  async remove(role: RbacRole): Promise<void> {
    if (
      role.isSystemRole ||
      role.assignedUsers ||
      !(await this.feedback.confirm('Delete role?', 'Delete ' + role.name + '?'))
    )
      return;
    try {
      await firstValueFrom(this.service.delete(role.id));
      this.feedback.toast('Role deleted successfully.');
      await this.load();
    } catch (error) {
      showMutationError(this.feedback, error);
    }
  }
}
