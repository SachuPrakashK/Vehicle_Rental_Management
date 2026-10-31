import type { Request, Response } from 'express';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { env } from '../config/env.js';
import { safeUser } from '../models/user.model.js';
import * as users from '../repositories/user.repository.js';
import {
  deleteProfileImage,
  type ImageKind,
  validateBlobImage,
} from '../services/file-storage.service.js';
import { success } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';
import { verifyAccessToken } from '../utils/tokens.js';

interface ClientPayload {
  accessToken: string;
  kind: ImageKind;
}

function parsePayload(value: string | null): ClientPayload {
  try {
    const parsed = JSON.parse(value ?? '') as Partial<ClientPayload>;
    if (
      typeof parsed.accessToken !== 'string' ||
      !['profile-images', 'vehicle-images'].includes(String(parsed.kind))
    )
      throw new Error();
    return parsed as ClientPayload;
  } catch {
    throw new AppError(401, 'Authentication is required to upload images.');
  }
}

export async function token(request: Request, response: Response) {
  if (env.IMAGE_STORAGE_DRIVER !== 'vercel-blob')
    throw new AppError(404, 'Blob uploads are not enabled.');

  const result = await handleUpload({
    body: request.body as HandleUploadBody,
    request,
    onBeforeGenerateToken: async (pathname, clientPayload) => {
      const payload = parsePayload(clientPayload);
      let claims;
      try {
        claims = verifyAccessToken(payload.accessToken);
      } catch {
        throw new AppError(401, 'Invalid access token.');
      }
      const user = await users.findUserById(claims.sub);
      if (!user?.is_active) throw new AppError(401, 'Invalid access token.');
      if (!pathname.startsWith(payload.kind + '/' + user.id + '/'))
        throw new AppError(422, 'Invalid image upload path.');
      return {
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maximumSizeInBytes: env.IMAGE_UPLOAD_MAX_MB * 1024 * 1024,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ userId: user.id, kind: payload.kind }),
      };
    },
    onUploadCompleted: async () => undefined,
  });
  response.json(result);
}

export async function finalize(request: Request, response: Response) {
  if (env.IMAGE_STORAGE_DRIVER !== 'vercel-blob')
    throw new AppError(404, 'Blob uploads are not enabled.');
  const { url, kind } = request.body as { url?: unknown; kind?: unknown };
  if (typeof url !== 'string' || !['profile-images', 'vehicle-images'].includes(String(kind)))
    throw new AppError(422, 'A valid uploaded image is required.');
  await validateBlobImage(url, kind as ImageKind, request.user!.id);
  if (kind === 'vehicle-images') {
    success(response, 201, 'Vehicle image uploaded successfully.', { url });
    return;
  }
  const current = await users.findUserById(request.user!.id);
  if (!current) throw new AppError(404, 'User not found.');
  try {
    const updated = await users.updateProfileImage(current.id, url);
    await deleteProfileImage(current.profile_image);
    success(response, 200, 'Profile image updated successfully.', safeUser(updated));
  } catch (error) {
    await deleteProfileImage(url);
    throw error;
  }
}
