import type { Request, Response } from 'express';
import { saveVehicleImage } from '../services/file-storage.service.js';
import { AppError } from '../utils/app-error.js';
import { success } from '../utils/api-response.js';
import { env } from '../config/env.js';

export async function upload(request: Request, response: Response) {
  if (env.IMAGE_STORAGE_DRIVER !== 'local')
    throw new AppError(409, 'Use the configured direct image upload flow.');
  if (!request.file) throw new AppError(422, 'Vehicle image is required.');
  const url = await saveVehicleImage(request.file);
  success(response, 201, 'Vehicle image uploaded successfully.', { url });
}
