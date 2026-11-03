import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import * as fleet from '../services/fleet-intelligence.service.js';
import { AppError } from '../utils/app-error.js';
import { success } from '../utils/api-response.js';
import { traccarPositions } from '../services/traccar.provider.js';

export async function overview(request: Request, response: Response) {
  success(
    response,
    200,
    'Fleet overview loaded.',
    await fleet.overview(request.permissions?.includes('fleet.maintenance.view') ?? false),
  );
}
export async function maintenance(_request: Request, response: Response) {
  success(response, 200, 'Maintenance records loaded.', await fleet.maintenance());
}
export async function maintenanceById(request: Request, response: Response) {
  success(
    response,
    200,
    'Maintenance record loaded.',
    await fleet.maintenanceById(String(request.params['id'])),
  );
}
export async function createMaintenance(request: Request, response: Response) {
  success(
    response,
    201,
    'Maintenance scheduled.',
    await fleet.createMaintenance(request.body, request.user!.id),
  );
}
export async function updateMaintenance(request: Request, response: Response) {
  success(
    response,
    200,
    'Maintenance record updated.',
    await fleet.updateMaintenance(String(request.params['id']), request.body),
  );
}
export async function deleteMaintenance(request: Request, response: Response) {
  await fleet.deleteMaintenance(String(request.params['id']));
  success(response, 200, 'Maintenance record deleted.', null);
}
export async function completeMaintenance(request: Request, response: Response) {
  success(
    response,
    200,
    'Maintenance completed.',
    await fleet.completeMaintenance(String(request.params['id']), request.body),
  );
}
export async function schedules(_request: Request, response: Response) {
  success(response, 200, 'Maintenance schedules loaded.', await fleet.schedules());
}
export async function createSchedule(request: Request, response: Response) {
  success(
    response,
    201,
    'Maintenance schedule created.',
    await fleet.createSchedule(request.body, request.user!.id),
  );
}
export async function inspections(_request: Request, response: Response) {
  success(response, 200, 'Inspections loaded.', await fleet.inspections());
}
export async function createInspection(request: Request, response: Response) {
  success(
    response,
    201,
    'Inspection recorded.',
    await fleet.createInspection(request.body, request.user!.id),
  );
}
export async function health(_request: Request, response: Response) {
  success(response, 200, 'Vehicle health loaded.', await fleet.health());
}
export async function tracking(_request: Request, response: Response) {
  if (env.TRACCAR_BASE_URL) await fleet.ingestProviderPositions(await traccarPositions());
  success(
    response,
    200,
    'Tracking status loaded.',
    await fleet.latestLocations(!!env.TRACCAR_BASE_URL),
  );
}
export async function simulate(request: Request, response: Response) {
  if (!env.FLEET_SIMULATOR_ENABLED || env.NODE_ENV === 'production')
    throw new AppError(403, 'The local GPS simulator is unavailable.');
  success(
    response,
    202,
    'Simulated position accepted.',
    await fleet.ingestSimulation(request.body),
  );
}
export async function alerts(_request: Request, response: Response) {
  success(response, 200, 'Fleet alerts loaded.', await fleet.alerts());
}
export async function acknowledge(request: Request, response: Response) {
  success(
    response,
    200,
    'Fleet alert acknowledged.',
    await fleet.updateAlert(String(request.params['id']), 'ACKNOWLEDGED', request.user!.id),
  );
}
export async function resolve(request: Request, response: Response) {
  success(
    response,
    200,
    'Fleet alert resolved.',
    await fleet.updateAlert(
      String(request.params['id']),
      'RESOLVED',
      request.user!.id,
      request.body.resolutionNotes,
    ),
  );
}
export async function geofences(_request: Request, response: Response) {
  success(response, 200, 'Geofences loaded.', await fleet.geofences());
}
export async function geofenceById(request: Request, response: Response) {
  success(
    response,
    200,
    'Geofence loaded.',
    await fleet.geofenceById(String(request.params['id'])),
  );
}
export async function createGeofence(request: Request, response: Response) {
  success(
    response,
    201,
    'Geofence created.',
    await fleet.createGeofence(request.body, request.user!.id),
  );
}
export async function updateGeofence(request: Request, response: Response) {
  success(
    response,
    200,
    'Geofence updated.',
    await fleet.updateGeofence(String(request.params['id']), request.body, request.user!.id),
  );
}
export async function deleteGeofence(request: Request, response: Response) {
  await fleet.deleteGeofence(String(request.params['id']));
  success(response, 200, 'Geofence deleted.', null);
}
export async function analytics(_request: Request, response: Response) {
  success(response, 200, 'Fleet analytics loaded.', await fleet.analytics());
}
export async function forecasts(_request: Request, response: Response) {
  success(response, 200, 'Maintenance forecasts loaded.', await fleet.forecasts());
}
export async function capabilities(_request: Request, response: Response) {
  success(response, 200, 'Fleet capabilities loaded.', {
    maintenance: env.FLEET_MAINTENANCE_ENABLED,
    health: env.FLEET_HEALTH_ENABLED,
    tracking: env.FLEET_TRACKING_ENABLED,
    geofencing: env.FLEET_GEOFENCING_ENABLED,
    predictions: env.FLEET_PREDICTIONS_ENABLED,
    simulator: env.FLEET_SIMULATOR_ENABLED && env.NODE_ENV !== 'production',
    trackingProvider: env.TRACCAR_BASE_URL ? 'TRACCAR' : null,
    telemetryRetentionDays: env.TELEMETRY_RETENTION_DAYS,
  });
}
