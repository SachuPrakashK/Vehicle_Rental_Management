import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { AuthApiResponse } from '../../core/models/auth.models';
import type {
  FleetAlert,
  FleetAnalytics,
  FleetCapabilities,
  FleetForecast,
  FleetGeofence,
  FleetOverview,
  MaintenanceRecord,
  TrackingStatus,
  VehicleHealth,
} from './fleet-intelligence.models';

@Injectable({ providedIn: 'root' })
export class FleetIntelligenceService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.authApiBaseUrl + '/fleet-intelligence';
  private get<T>(path: string) {
    return this.http
      .get<AuthApiResponse<T>>(this.url + path)
      .pipe(map((response) => response.data));
  }
  capabilities() {
    return this.get<FleetCapabilities>('/capabilities');
  }
  overview() {
    return this.get<FleetOverview>('/overview');
  }
  maintenance() {
    return this.get<MaintenanceRecord[]>('/maintenance');
  }
  createMaintenance(value: unknown) {
    return this.http
      .post<AuthApiResponse<MaintenanceRecord>>(this.url + '/maintenance', value)
      .pipe(map((response) => response.data));
  }
  completeMaintenance(id: string, value: unknown) {
    return this.http
      .post<AuthApiResponse<MaintenanceRecord>>(
        this.url + '/maintenance/' + id + '/complete',
        value,
      )
      .pipe(map((response) => response.data));
  }
  health() {
    return this.get<VehicleHealth[]>('/health');
  }
  tracking() {
    return this.get<TrackingStatus>('/tracking');
  }
  simulate(value: unknown) {
    return this.http
      .post<AuthApiResponse<{ simulated: boolean }>>(this.url + '/tracking/simulate', value)
      .pipe(map((response) => response.data));
  }
  alerts() {
    return this.get<FleetAlert[]>('/alerts');
  }
  acknowledge(id: string) {
    return this.http
      .patch<AuthApiResponse<FleetAlert>>(this.url + '/alerts/' + id + '/acknowledge', {})
      .pipe(map((response) => response.data));
  }
  resolve(id: string, resolutionNotes: string) {
    return this.http
      .patch<AuthApiResponse<FleetAlert>>(this.url + '/alerts/' + id + '/resolve', {
        resolutionNotes,
      })
      .pipe(map((response) => response.data));
  }
  analytics() {
    return this.get<FleetAnalytics[]>('/analytics');
  }
  geofences() {
    return this.get<FleetGeofence[]>('/geofences');
  }
  createGeofence(value: unknown) {
    return this.http
      .post<AuthApiResponse<FleetGeofence>>(this.url + '/geofences', value)
      .pipe(map((response) => response.data));
  }
  forecasts() {
    return this.get<FleetForecast[]>('/forecasts');
  }
}
