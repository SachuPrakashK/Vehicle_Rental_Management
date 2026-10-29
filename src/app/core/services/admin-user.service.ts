import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { AdminUser } from '../models/api.models';
import type { AuthApiResponse, UserRole } from '../models/auth.models';
export interface SaveAdminUser {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  password?: string;
}
@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.authApiBaseUrl + '/admin/users';
  list() {
    return this.http.get<AuthApiResponse<AdminUser[]>>(this.url).pipe(map((r) => r.data));
  }
  create(user: SaveAdminUser) {
    return this.http.post<AuthApiResponse<AdminUser>>(this.url, user).pipe(map((r) => r.data));
  }
  update(id: string, user: SaveAdminUser) {
    return this.http
      .put<AuthApiResponse<AdminUser>>(this.url + '/' + id, user)
      .pipe(map((r) => r.data));
  }
  delete(id: string) {
    return this.http.delete<AuthApiResponse<null>>(this.url + '/' + id);
  }
  clear(): void {}
}
