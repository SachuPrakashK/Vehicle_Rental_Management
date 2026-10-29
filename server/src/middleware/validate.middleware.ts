import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../utils/app-error.js';
export const validateBody =
  (schema: ZodType): RequestHandler =>
  (request, _response, next) => {
    const result = schema.safeParse(request.body);
    if (!result.success)
      return next(new AppError(422, 'Validation failed.', result.error.flatten().fieldErrors));
    request.body = result.data;
    next();
  };
