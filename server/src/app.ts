import path from 'node:path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import adminUserRoutes from './routes/admin-user.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js';
import bikeRoutes from './routes/bike.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import { profileUploadRoot, vehicleUploadRoot } from './services/file-storage.service.js';
export const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = new Set([
  env.FRONTEND_ORIGIN,
  ...(env.VERCEL_URL ? ['https://' + env.VERCEL_URL] : []),
]);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(cookieParser());
app.get('/api/health', (_request, response) =>
  response.json({ success: true, message: 'Fleetline API is healthy.', data: null }),
);
if (env.IMAGE_STORAGE_DRIVER === 'local') {
  app.use(
    '/uploads/profile-images',
    express.static(path.resolve(profileUploadRoot), {
      fallthrough: false,
      index: false,
      maxAge: env.NODE_ENV === 'production' ? '1d' : 0,
    }),
  );
  app.use(
    '/uploads/vehicle-images',
    express.static(path.resolve(vehicleUploadRoot), {
      fallthrough: false,
      index: false,
      maxAge: env.NODE_ENV === 'production' ? '1d' : 0,
    }),
  );
}
app.use('/api/auth', authRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/uploads', uploadRoutes);
app.use(notFound);
app.use(errorHandler);
