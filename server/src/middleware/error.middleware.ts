import type { ErrorRequestHandler, RequestHandler } from 'express';
import multer from 'multer';
import { AppError } from '../utils/app-error.js';
import { env } from '../config/env.js';
export const notFound: RequestHandler = (_request, _response, next) =>
  next(new AppError(404, 'Resource not found.'));
export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof multer.MulterError) {
    response.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
      success: false,
      message:
        error.code === 'LIMIT_FILE_SIZE'
          ? `Image must not exceed ${env.IMAGE_UPLOAD_MAX_MB} MB.`
          : 'Invalid file upload.',
      errors: [],
    });
    return;
  }
  if ((error as { code?: unknown }).code === '23505') {
    response.status(409).json({
      success: false,
      message: 'A record with these details already exists.',
      errors: [],
    });
    return;
  }
  const status = error instanceof AppError ? error.status : 500;
  response.status(status).json({
    success: false,
    message: status === 500 ? 'An unexpected server error occurred.' : error.message,
    errors: error instanceof AppError ? (error.errors ?? []) : [],
  });
};
