import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import type { AuthUser } from '../models/auth.models';
import { validateProfileImage } from '../../shared/utils/validators';
import { AuthStore } from './auth-store.service';
import { ProfileService } from './profile.service';

const user: AuthUser = {
  id: 'user-1',
  firstName: 'Fleet',
  lastName: 'Manager',
  email: 'manager@example.com',
  phone: null,
  role: 'ADMIN',
  profileImage: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  lastLoginAt: null,
};

describe('ProfileService', () => {
  it('uploads the image field as FormData and updates the profile state', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(ProfileService);
    const store = TestBed.inject(AuthStore);
    const http = TestBed.inject(HttpTestingController);
    const file = new File([new Uint8Array([137, 80, 78, 71])], 'avatar.png', {
      type: 'image/png',
    });
    const updated = { ...user, profileImage: '/uploads/profile-images/avatar.png' };

    service.updateImage(file).subscribe();

    const request = http.expectOne(environment.authApiBaseUrl + '/auth/me/profile-image');
    expect(request.request.body).toBeInstanceOf(FormData);
    expect((request.request.body as FormData).get('image')).toBe(file);
    expect(request.request.headers.has('Content-Type')).toBe(false);
    request.flush({ success: true, message: 'Updated.', data: updated });

    expect(store.user()).toEqual(updated);
    expect(service.imageUrl(updated.profileImage)).toBe('/uploads/profile-images/avatar.png');
    http.verify();
  });

  it('rejects unsupported and oversized images before upload', () => {
    const unsupported = new File(['content'], 'avatar.gif', { type: 'image/gif' });
    const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'avatar.png', {
      type: 'image/png',
    });

    expect(validateProfileImage(unsupported)).toBe('Please select a JPG, PNG, or WebP image.');
    expect(validateProfileImage(oversized)).toBe('Profile image must not exceed 5 MB.');
  });
});
