import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
const signatures: { mime: string; extension: string; matches: (buffer: Buffer) => boolean }[] = [
  {
    mime: 'image/jpeg',
    extension: 'jpg',
    matches: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: 'image/png',
    extension: 'png',
    matches: (b) => b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  },
  {
    mime: 'image/webp',
    extension: 'webp',
    matches: (b) =>
      b.length > 12 &&
      b.subarray(0, 4).toString() === 'RIFF' &&
      b.subarray(8, 12).toString() === 'WEBP',
  },
];
const profileRoot = path.resolve(env.UPLOAD_DIRECTORY);
const vehicleRoot = path.resolve(env.VEHICLE_UPLOAD_DIRECTORY);
async function saveImage(
  file: Express.Multer.File,
  root: string,
  referenceRoot: string,
): Promise<string> {
  const type = signatures.find((item) => item.mime === file.mimetype && item.matches(file.buffer));
  if (!type) throw new AppError(422, 'Choose a valid JPEG, PNG, or WebP image.');
  await fs.mkdir(root, { recursive: true });
  const name = crypto.randomUUID() + '.' + type.extension;
  await fs.writeFile(path.join(root, name), file.buffer, { flag: 'wx' });
  return referenceRoot + '/' + name;
}
export function saveProfileImage(file: Express.Multer.File): Promise<string> {
  return saveImage(file, profileRoot, '/uploads/profile-images');
}
export function saveVehicleImage(file: Express.Multer.File): Promise<string> {
  return saveImage(file, vehicleRoot, '/uploads/vehicle-images');
}
export async function deleteProfileImage(reference: string | null): Promise<void> {
  if (!reference) return;
  const name = path.basename(reference);
  const target = path.resolve(profileRoot, name);
  if (path.dirname(target) !== profileRoot)
    throw new AppError(400, 'Invalid profile image reference.');
  await fs.rm(target, { force: true });
}
export const profileUploadRoot = profileRoot;
export const vehicleUploadRoot = vehicleRoot;
