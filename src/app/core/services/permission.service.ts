import { computed, inject, Injectable } from '@angular/core';
import type { PermissionCode } from '../models/rbac.models';
import { AuthStore } from './auth-store.service';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly store = inject(AuthStore);
  readonly permissions = this.store.permissions;
  readonly resolved = computed(() => this.store.isResolved());

  has(permission: PermissionCode): boolean {
    return this.permissions().includes(permission);
  }

  hasAny(permissions: PermissionCode[]): boolean {
    return permissions.some((permission) => this.has(permission));
  }

  hasAll(permissions: PermissionCode[]): boolean {
    return permissions.every((permission) => this.has(permission));
  }
}
