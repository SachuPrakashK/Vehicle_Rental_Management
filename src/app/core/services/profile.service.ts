import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { AuthApiResponse, AuthUser } from '../models/auth.models';
import { validateProfileImage } from '../../shared/utils/validators';
import { AuthStore } from './auth-store.service';
import { ImageUploadService } from './image-upload.service';
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(AuthStore);
  private readonly imageUploads = inject(ImageUploadService);
  readonly profile = computed(() => this.store.user());
  update(details: { firstName: string; lastName: string; phone: string | null }) {
    return this.http
      .put<AuthApiResponse<AuthUser>>(environment.authApiBaseUrl + '/auth/me', details, {
        withCredentials: true,
      })
      .pipe(
        map((r) => r.data),
        tap((user) => this.store.updateUser(user)),
      );
  }
  updateImage(file: File) {
    const error = validateProfileImage(file);
    if (error) throw new Error(error);
    if (environment.blobImageUploads)
      return this.imageUploads.upload(file, 'profile-images').pipe(
        map((user) => user as AuthUser),
        tap((user) => this.store.updateUser(user)),
      );
    const body = new FormData();
    body.append('image', file);
    return this.http
      .post<AuthApiResponse<AuthUser>>(
        environment.authApiBaseUrl + '/auth/me/profile-image',
        body,
        { withCredentials: true },
      )
      .pipe(
        map((r) => r.data),
        tap((user) => this.store.updateUser(user)),
      );
  }
  deleteImage() {
    return this.http
      .delete<AuthApiResponse<AuthUser>>(environment.authApiBaseUrl + '/auth/me/profile-image', {
        withCredentials: true,
      })
      .pipe(
        map((r) => r.data),
        tap((user) => this.store.updateUser(user)),
      );
  }
  imageUrl(reference: string | null): string | null {
    if (!reference) return null;
    if (/^https?:\/\//.test(reference)) return reference;
    return reference.startsWith('/') ? reference : '/' + reference;
  }
}
