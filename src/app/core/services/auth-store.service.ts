import { computed, Injectable, signal } from '@angular/core';
import type { AuthorizationSnapshot, AuthSession, AuthUser } from '../models/auth.models';
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly userState = signal<AuthUser | null>(null);
  private readonly tokenState = signal<string | null>(null);
  readonly user = this.userState.asReadonly();
  readonly accessToken = this.tokenState.asReadonly();
  readonly isAuthenticated = computed(() => !!this.userState() && !!this.tokenState());
  readonly isResolved = signal(false);
  readonly isSuperAdmin = computed(() => this.user()?.role === 'SUPER_ADMIN');
  readonly permissions = computed(() => this.user()?.permissions ?? []);
  setSession(session: AuthSession): void {
    this.userState.set(session.user);
    this.tokenState.set(session.accessToken);
    this.isResolved.set(true);
  }
  updateUser(user: AuthUser): void {
    // Profile APIs return a SafeUser without RBAC fields. Preserve the current
    // authorization snapshot rather than replacing it with an empty one.
    const current = this.userState();
    this.userState.set({
      ...current,
      ...user,
      roles: user.roles ?? current?.roles,
      permissions: user.permissions ?? current?.permissions,
    });
  }
  updateAuthorization(authorization: AuthorizationSnapshot): void {
    const current = this.userState();
    if (!current) return;
    this.userState.set({
      ...current,
      roles: authorization.roles,
      permissions: authorization.permissions,
    });
  }
  clear(): void {
    this.userState.set(null);
    this.tokenState.set(null);
    this.isResolved.set(true);
  }
}
