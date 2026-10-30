import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { UserRole } from '../models/user.model.js';

export interface AccessClaims {
  sub: string;
  role: UserRole;
  type: 'access';
}
export const randomToken = (): string => crypto.randomBytes(48).toString('base64url');
export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');
export function signAccessToken(userId: string, role: UserRole): string {
  return jwt.sign({ role, type: 'access' }, env.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'],
    issuer: 'fleetline-api',
    audience: 'fleetline-web',
  });
}
export function verifyAccessToken(token: string): AccessClaims {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'fleetline-api',
    audience: 'fleetline-web',
  });
  if (
    typeof payload === 'string' ||
    payload['type'] !== 'access' ||
    typeof payload.sub !== 'string' ||
    !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(String(payload['role']))
  )
    throw new Error('Invalid access token');
  return payload as AccessClaims;
}
