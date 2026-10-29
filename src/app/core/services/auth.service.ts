import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  Observable,
  catchError,
  finalize,
  firstValueFrom,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  AuthApiResponse,
  AuthSession,
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from '../models/auth.models';
import { SILENT_REQUEST } from '../http/http-context';
import { AuthStore } from './auth-store.service';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  readonly store = inject(AuthStore);
  private refreshRequest?: Observable<AuthSession>;
  readonly user = this.store.user;
  readonly accessToken = this.store.accessToken;
  readonly isAuthenticated = this.store.isAuthenticated;
  readonly isSuperAdmin = this.store.isSuperAdmin;
  readonly canEnter = this.store.isAuthenticated;
  private auth<T>(path: string, body?: unknown) {
    return this.http.post<AuthApiResponse<T>>(
      environment.authApiBaseUrl + '/auth/' + path,
      body ?? {},
      { withCredentials: true },
    );
  }
  login(request: LoginRequest) {
    return this.auth<AuthSession>('login', request).pipe(
      map((r) => r.data),
      tap((session) => this.store.setSession(session)),
    );
  }
  register(request: RegisterRequest) {
    return this.auth<AuthUser>('register', request).pipe(map((r) => r.data));
  }
  forgotPassword(email: string) {
    return this.auth<{ resetToken?: string }>('forgot-password', { email }).pipe(
      map((r) => r.data),
    );
  }
  verifyResetToken(token: string) {
    return this.auth<null>('verify-reset-token', { token });
  }
  resetPassword(token: string, password: string, confirmPassword: string) {
    return this.auth<null>('reset-password', { token, password, confirmPassword });
  }
  changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
    return this.auth<null>('change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    }).pipe(tap(() => this.store.clear()));
  }
  refreshSession(): Observable<AuthSession> {
    if (!this.refreshRequest)
      this.refreshRequest = this.auth<AuthSession>('refresh-token').pipe(
        map((r) => r.data),
        tap((session) => this.store.setSession(session)),
        finalize(() => (this.refreshRequest = undefined)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.refreshRequest;
  }
  getCurrentUser() {
    return this.http
      .get<AuthApiResponse<AuthUser>>(environment.authApiBaseUrl + '/auth/me', {
        withCredentials: true,
      })
      .pipe(
        map((r) => r.data),
        tap((user) => this.store.updateUser(user)),
      );
  }
  restoreSession(): Promise<void> {
    const context = new HttpContext().set(SILENT_REQUEST, true);
    return firstValueFrom(
      this.http
        .post<AuthApiResponse<AuthSession>>(
          environment.authApiBaseUrl + '/auth/refresh-token',
          {},
          { withCredentials: true, context },
        )
        .pipe(
          map((r) => r.data),
          tap((session) => this.store.setSession(session)),
          switchMap(() => this.getCurrentUser()),
          map(() => void 0),
          catchError(() => {
            this.store.clear();
            return of(void 0);
          }),
        ),
    );
  }
  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.auth<null>('logout'));
    } finally {
      this.store.clear();
      await this.router.navigateByUrl('/auth/login');
    }
  }
  invalidate(): void {
    this.store.clear();
    void this.router.navigateByUrl('/auth/login');
  }
}
