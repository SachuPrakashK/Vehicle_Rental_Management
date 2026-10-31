import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { upload } from '@vercel/blob/client';
import { from, map, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { AuthApiResponse, AuthUser } from '../models/auth.models';
import { AuthStore } from './auth-store.service';

export type ImageUploadKind = 'profile-images' | 'vehicle-images';

@Injectable({ providedIn: 'root' })
export class ImageUploadService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(AuthStore);

  upload(file: File, kind: ImageUploadKind) {
    const accessToken = this.store.accessToken();
    const user = this.store.user();
    if (!accessToken || !user) throw new Error('Sign in before uploading an image.');
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    return from(
      upload(`${kind}/${user.id}/${safeName}`, file, {
        access: 'public',
        handleUploadUrl: environment.authApiBaseUrl + '/uploads/token',
        clientPayload: JSON.stringify({ accessToken, kind }),
      }),
    ).pipe(
      switchMap((blob) =>
        this.http.post<AuthApiResponse<{ url: string } | AuthUser>>(
          environment.authApiBaseUrl + '/uploads/finalize',
          { url: blob.url, kind },
          { withCredentials: true },
        ),
      ),
      map((response) => response.data),
    );
  }
}
