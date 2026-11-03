import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

interface TraccarPosition {
  id: number;
  deviceId: number;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  accuracy: number;
  fixTime: string;
  attributes?: { ignition?: boolean };
}

export interface NormalizedPosition {
  externalDeviceId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  accuracy: number;
  ignition: boolean | null;
  recordedAt: string;
}

export async function traccarPositions(): Promise<NormalizedPosition[]> {
  if (!env.TRACCAR_BASE_URL || !env.TRACCAR_USERNAME || !env.TRACCAR_PASSWORD) return [];
  const authorization = Buffer.from(`${env.TRACCAR_USERNAME}:${env.TRACCAR_PASSWORD}`).toString(
    'base64',
  );
  let response: globalThis.Response;
  try {
    response = await fetch(`${env.TRACCAR_BASE_URL.replace(/\/$/, '')}/api/positions`, {
      headers: { Authorization: `Basic ${authorization}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new AppError(503, 'The configured tracking provider is temporarily unavailable.');
  }
  if (!response.ok)
    throw new AppError(502, 'The configured tracking provider rejected the request.');
  const positions = (await response.json()) as TraccarPosition[];
  return positions.map((position) => ({
    externalDeviceId: String(position.deviceId),
    latitude: position.latitude,
    longitude: position.longitude,
    speed: position.speed * 1.852,
    heading: position.course,
    accuracy: position.accuracy,
    ignition: position.attributes?.ignition ?? null,
    recordedAt: position.fixTime,
  }));
}
