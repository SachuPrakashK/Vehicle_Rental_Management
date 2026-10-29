import type { Response } from 'express';
export function success<T>(response: Response, status: number, message: string, data?: T): void {
  response.status(status).json({ success: true, message, data: data ?? null });
}
