import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import * as auth from '../services/auth.service.js';
import * as users from '../repositories/user.repository.js';
import { safeUser } from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';
import { success } from '../utils/api-response.js';
const cookieName = 'fleetline_refresh';
const cookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
  path: '/api/auth',
  domain: env.COOKIE_DOMAIN,
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86400000,
} as const;
const setCookie = (response: Response, token: string) =>
  response.cookie(cookieName, token, cookieOptions);
export async function register(request: Request, response: Response) {
  success(response, 201, 'Registration successful.', await auth.register(request.body));
}
export async function login(request: Request, response: Response) {
  const result = await auth.login(request.body.email, request.body.password);
  setCookie(response, result.refreshToken);
  success(response, 200, 'Login successful.', {
    user: result.user,
    accessToken: result.accessToken,
  });
}
export async function refresh(request: Request, response: Response) {
  const result = await auth.refresh(String(request.cookies[cookieName] ?? ''));
  setCookie(response, result.refreshToken);
  success(response, 200, 'Session refreshed.', {
    user: result.user,
    accessToken: result.accessToken,
  });
}
export async function logout(request: Request, response: Response) {
  await auth.logout(String(request.cookies[cookieName] ?? ''));
  response.clearCookie(cookieName, { ...cookieOptions, maxAge: undefined });
  success(response, 200, 'Logged out successfully.');
}
export async function forgotPassword(request: Request, response: Response) {
  const data = await auth.forgotPassword(request.body.email);
  success(
    response,
    200,
    'If an account exists for this email, password reset instructions have been sent.',
    data,
  );
}
export async function verifyReset(request: Request, response: Response) {
  await auth.verifyResetToken(request.body.token);
  success(response, 200, 'Reset token is valid.');
}
export async function resetPassword(request: Request, response: Response) {
  await auth.resetPassword(request.body.token, request.body.password);
  response.clearCookie(cookieName, { ...cookieOptions, maxAge: undefined });
  success(response, 200, 'Password reset successfully. Please sign in.');
}
export async function changePassword(request: Request, response: Response) {
  await auth.changePassword(
    request.user!.id,
    request.body.currentPassword,
    request.body.newPassword,
  );
  response.clearCookie(cookieName, { ...cookieOptions, maxAge: undefined });
  success(response, 200, 'Password changed successfully. Please sign in again.');
}
export async function me(request: Request, response: Response) {
  const user = await users.findUserById(request.user!.id);
  if (!user) throw new AppError(404, 'User not found.');
  success(response, 200, 'Current user loaded.', safeUser(user));
}
export async function updateMe(request: Request, response: Response) {
  const user = await users.updateProfile(
    request.user!.id,
    request.body.firstName,
    request.body.lastName,
    request.body.phone ?? null,
  );
  success(response, 200, 'Profile updated successfully.', safeUser(user));
}
