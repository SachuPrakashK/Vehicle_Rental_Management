import type { Request, Response } from 'express';
import * as users from '../repositories/user.repository.js';
import { safeUser } from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';
import { deleteProfileImage, saveProfileImage } from '../services/file-storage.service.js';
import { success } from '../utils/api-response.js';
import { env } from '../config/env.js';
export async function upload(request: Request, response: Response) {
  if (env.IMAGE_STORAGE_DRIVER !== 'local')
    throw new AppError(409, 'Use the configured direct image upload flow.');
  if (!request.file) throw new AppError(422, 'Profile image is required.');
  const current = await users.findUserById(request.user!.id);
  if (!current) throw new AppError(404, 'User not found.');
  const reference = await saveProfileImage(request.file);
  try {
    const updated = await users.updateProfileImage(current.id, reference);
    await deleteProfileImage(current.profile_image);
    success(response, 200, 'Profile image updated successfully.', safeUser(updated));
  } catch (error) {
    await deleteProfileImage(reference);
    throw error;
  }
}
export async function remove(request: Request, response: Response) {
  const current = await users.findUserById(request.user!.id);
  if (!current) throw new AppError(404, 'User not found.');
  const updated = await users.updateProfileImage(current.id, null);
  await deleteProfileImage(current.profile_image);
  success(response, 200, 'Profile image deleted successfully.', safeUser(updated));
}
