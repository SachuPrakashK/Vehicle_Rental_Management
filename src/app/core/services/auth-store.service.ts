import { computed, Injectable, signal } from '@angular/core';
import type { AuthSession, AuthUser } from '../models/auth.models';
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly userState = signal<AuthUser | null>(null);
  private readonly tokenState = signal<string | null>(null);
  readonly user = this.userState.asReadonly();
  readonly accessToken = this.tokenState.asReadonly();
  readonly isAuthenticated = computed(() => !!this.userState() && !!this.tokenState());
  readonly isResolved = signal(false);
  readonly isSuperAdmin = computed(() => this.user()?.role === 'SUPER_ADMIN');
  setSession(session: AuthSession): void {
    this.userState.set(session.user);
    this.tokenState.set(session.accessToken);
    this.isResolved.set(true);
  }
  updateUser(user: AuthUser): void {
    this.userState.set(user);
  }
  clear(): void {
    this.userState.set(null);
    this.tokenState.set(null);
    this.isResolved.set(true);
  }
}
