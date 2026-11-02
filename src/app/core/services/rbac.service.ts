import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { AuthApiResponse, RoleSummary } from '../models/auth.models';
import type { Permission, RbacRole } from '../models/rbac.models';

export interface SaveRole {
  name: string;
  code?: string;
  description: string;
  isActive: boolean;
  version?: number;
}

@Injectable({ providedIn: 'root' })
export class RbacService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.authApiBaseUrl + '/authorization';

  roles() {
    return this.http
      .get<AuthApiResponse<RbacRole[]>>(this.url + '/roles')
      .pipe(map((response) => response.data));
  }
  permissions() {
    return this.http
      .get<AuthApiResponse<Permission[]>>(this.url + '/permissions')
      .pipe(map((response) => response.data));
  }
  create(role: SaveRole) {
    return this.http
      .post<AuthApiResponse<RbacRole>>(this.url + '/roles', role)
      .pipe(map((response) => response.data));
  }
  update(id: string, role: SaveRole) {
    return this.http
      .patch<AuthApiResponse<RbacRole>>(this.url + '/roles/' + id, role)
      .pipe(map((response) => response.data));
  }
  updatePermissions(id: string, permissionIds: string[], version: number) {
    return this.http
      .put<AuthApiResponse<RbacRole>>(this.url + '/roles/' + id + '/permissions', {
        permissionIds,
        version,
      })
      .pipe(map((response) => response.data));
  }
  delete(id: string) {
    return this.http.delete<AuthApiResponse<null>>(this.url + '/roles/' + id);
  }
  userRoles(userId: string) {
    return this.http
      .get<AuthApiResponse<RoleSummary[]>>(this.url + '/users/' + userId + '/roles')
      .pipe(map((response) => response.data));
  }
  assignUserRoles(userId: string, roleIds: string[]) {
    return this.http
      .put<AuthApiResponse<RoleSummary[]>>(this.url + '/users/' + userId + '/roles', { roleIds })
      .pipe(map((response) => response.data));
  }
}
