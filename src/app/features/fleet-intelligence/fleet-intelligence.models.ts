export interface FleetCapabilities {
  maintenance: boolean;
  health: boolean;
  tracking: boolean;
  geofencing: boolean;
  predictions: boolean;
  simulator: boolean;
  trackingProvider: 'TRACCAR' | null;
  telemetryRetentionDays: number;
}
export interface FleetOverview {
  openMaintenance: number;
  overdueMaintenance: number;
  openAlerts: number;
  criticalAlerts: number;
  maintenanceCost: number;
  trackedVehicles: number;
  maintenanceStatus: {
    knownVehicles: number;
    healthy: number;
    dueSoon: number;
    overdue: number;
    underMaintenance: number;
  };
  upcomingMaintenance: UpcomingMaintenance[];
  fleetHealth: {
    averageScore: number | null;
    assessedVehicles: number;
    averageCompleteness: number | null;
  };
}
export interface UpcomingMaintenance {
  vehicleRef: string;
  registrationNumber: string;
  serviceType: string;
  dueDate: string;
  dueOdometer: number | null;
  remainingKm: number | null;
  status: 'OVERDUE' | 'DUE_SOON' | 'PLANNED';
}
export interface MaintenanceRecord {
  id: string;
  vehicleRef: string;
  vehicleType: 'CAR' | 'BIKE';
  registrationNumber: string;
  maintenanceType: string;
  description: string;
  scheduledDate: string;
  completedDate: string | null;
  odometerReading: number | null;
  estimatedCost: number | null;
  actualCost: number | null;
  serviceProvider: string | null;
  status: 'SCHEDULED' | 'DUE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface VehicleHealth {
  vehicleRef: string;
  registrationNumber: string;
  healthScore: number;
  status: 'HEALTHY' | 'ATTENTION_RECOMMENDED' | 'MAINTENANCE_REQUIRED';
  method: 'RULE_BASED';
  version: string;
  dataCompleteness: number;
  factors: { overdueMaintenance: number; openInspectionDefects: number };
}
export interface FleetPosition {
  vehicleRef: string;
  deviceStatus: 'ONLINE' | 'OFFLINE' | 'STALE' | 'UNKNOWN';
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  recordedAt: string;
  source: string;
}
export interface TrackingStatus {
  providerConfigured: boolean;
  mode: 'TRACCAR' | 'SIMULATION';
  positions: FleetPosition[];
}
export interface FleetAlert {
  id: string;
  vehicleRef: string | null;
  registrationNumber: string | null;
  alertType: string;
  severity: 'INFORMATION' | 'WARNING' | 'CRITICAL';
  message: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  createdAt: string;
}
export interface FleetAnalytics {
  registrationNumber: string;
  serviceCount: number;
  maintenanceCost: number;
  downtimeDays: number;
}
export interface FleetGeofence {
  id: string;
  name: string;
  description: string | null;
  centerLatitude: number;
  centerLongitude: number;
  radiusMeters: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}
export interface FleetForecast {
  vehicleRef: string;
  registrationNumber: string;
  serviceType: string;
  nextDueDate: string | null;
  nextDueOdometer: number | null;
  forecastStatus: 'OVERDUE' | 'DUE_SOON' | 'PLANNED';
  method: 'DETERMINISTIC_INTERVAL';
}
