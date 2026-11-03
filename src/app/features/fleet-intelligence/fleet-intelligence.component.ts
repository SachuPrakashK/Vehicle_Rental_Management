import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import type { Vehicle } from '../../core/models/api.models';
import { FeedbackService } from '../../core/services/feedback.service';
import { PermissionService } from '../../core/services/permission.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AlertListComponent } from './components/alert-list/alert-list.component';
import { AnalyticsPanelComponent } from './components/analytics-panel/analytics-panel.component';
import { GeofenceListComponent } from './components/geofence-list/geofence-list.component';
import { GeofenceDialogComponent } from './components/geofence-dialog/geofence-dialog.component';
import { HealthListComponent } from './components/health-list/health-list.component';
import { MaintenanceListComponent } from './components/maintenance-list/maintenance-list.component';
import { MaintenanceDialogComponent } from './components/maintenance-dialog/maintenance-dialog.component';
import { FleetOverviewComponent } from './components/overview/fleet-overview.component';
import { TrackingPanelComponent } from './components/tracking-panel/tracking-panel.component';
import { SimulationDialogComponent } from './components/simulation-dialog/simulation-dialog.component';
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
import { FleetIntelligenceService } from './fleet-intelligence.service';

type FleetSection =
  'overview' | 'maintenance' | 'health' | 'tracking' | 'geofences' | 'alerts' | 'analytics';

@Component({
  selector: 'app-fleet-intelligence',
  imports: [
    RouterLink,
    PageHeaderComponent,
    AlertListComponent,
    AnalyticsPanelComponent,
    GeofenceDialogComponent,
    GeofenceListComponent,
    HealthListComponent,
    MaintenanceDialogComponent,
    MaintenanceListComponent,
    FleetOverviewComponent,
    SimulationDialogComponent,
    TrackingPanelComponent,
  ],
  templateUrl: './fleet-intelligence.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closePanels()' },
})
export class FleetIntelligenceComponent {
  private readonly api = inject(FleetIntelligenceService);
  private readonly vehicleApi = inject(VehicleService);
  private readonly feedback = inject(FeedbackService);
  private readonly fb = inject(FormBuilder);
  private readonly document = inject(DOCUMENT);
  readonly permissions = inject(PermissionService);
  readonly section = signal<FleetSection>(
    (inject(ActivatedRoute).snapshot.data['section'] as FleetSection) ?? 'overview',
  );
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly capabilities = signal<FleetCapabilities | null>(null);
  readonly overview = signal<FleetOverview | null>(null);
  readonly maintenance = signal<MaintenanceRecord[]>([]);
  readonly health = signal<VehicleHealth[]>([]);
  readonly tracking = signal<TrackingStatus | null>(null);
  readonly alerts = signal<FleetAlert[]>([]);
  readonly analytics = signal<FleetAnalytics[]>([]);
  readonly geofences = signal<FleetGeofence[]>([]);
  readonly forecasts = signal<FleetForecast[]>([]);
  readonly vehicles = signal<Vehicle[]>([]);
  readonly maintenanceOpen = signal(false);
  readonly simulationOpen = signal(false);
  readonly geofenceOpen = signal(false);
  readonly selectedVehicle = computed(() =>
    this.vehicles().find(
      (vehicle) => String(vehicle.carId) === this.maintenanceForm.controls.vehicleId.value,
    ),
  );
  readonly maintenanceForm = this.fb.nonNullable.group({
    vehicleId: ['', Validators.required],
    maintenanceType: ['', Validators.required],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
    scheduledDate: ['', Validators.required],
    odometerReading: [0, [Validators.required, Validators.min(0)]],
    estimatedCost: [0, Validators.min(0)],
    serviceProvider: [''],
  });
  readonly simulationForm = this.fb.nonNullable.group({
    vehicleId: ['', Validators.required],
    latitude: [20.5937, [Validators.required, Validators.min(-90), Validators.max(90)]],
    longitude: [78.9629, [Validators.required, Validators.min(-180), Validators.max(180)]],
    speed: [0, [Validators.min(0), Validators.max(300)]],
  });
  readonly geofenceForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
    centerLatitude: [20.5937, [Validators.required, Validators.min(-90), Validators.max(90)]],
    centerLongitude: [78.9629, [Validators.required, Validators.min(-180), Validators.max(180)]],
    radiusMeters: [500, [Validators.required, Validators.min(50), Validators.max(100000)]],
  });
  readonly sections: {
    key: FleetSection;
    label: string;
    permission: Parameters<PermissionService['has']>[0];
  }[] = [
    { key: 'overview', label: 'Overview', permission: 'fleet.overview.view' },
    { key: 'maintenance', label: 'Maintenance', permission: 'fleet.maintenance.view' },
    { key: 'health', label: 'Vehicle health', permission: 'fleet.health.view' },
    { key: 'tracking', label: 'Tracking', permission: 'fleet.tracking.view' },
    { key: 'geofences', label: 'Geofences', permission: 'fleet.geofences.view' },
    { key: 'alerts', label: 'Alerts', permission: 'fleet.alerts.view' },
    { key: 'analytics', label: 'Analytics', permission: 'fleet.analytics.view' },
  ];

  constructor() {
    effect(() => {
      const open = this.maintenanceOpen() || this.simulationOpen() || this.geofenceOpen();
      this.document.body.classList.toggle('fleet-overlay-open', open);
      return () => this.document.body.classList.remove('fleet-overlay-open');
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const section = this.section();
    const requests = {
      capabilities: this.api.capabilities(),
      vehicles:
        section === 'maintenance' || section === 'tracking' ? this.vehicleApi.list().pipe(catchError(() => of([] as Vehicle[]))) : of([]),
      data:
        section === 'maintenance'
          ? this.api.maintenance()
          : section === 'health'
            ? this.api.health()
            : section === 'tracking'
              ? this.api.tracking()
              : section === 'geofences'
                ? this.api.geofences()
                : section === 'alerts'
                  ? this.api.alerts()
                  : section === 'analytics'
                    ? forkJoin({
                        analytics: this.api.analytics(),
                        forecasts: this.permissions.has('fleet.predictions.view')
                          ? this.api.forecasts()
                          : of([] as FleetForecast[]),
                      })
                    : this.api.overview(),
    };
    forkJoin(requests)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ capabilities, vehicles, data }) => {
          this.capabilities.set(capabilities);
          this.vehicles.set(vehicles);
          if (section === 'maintenance') this.maintenance.set(data as MaintenanceRecord[]);
          else if (section === 'health') this.health.set(data as VehicleHealth[]);
          else if (section === 'tracking') this.tracking.set(data as TrackingStatus);
          else if (section === 'geofences') this.geofences.set(data as FleetGeofence[]);
          else if (section === 'alerts') this.alerts.set(data as FleetAlert[]);
          else if (section === 'analytics') {
            const result = data as { analytics: FleetAnalytics[]; forecasts: FleetForecast[] };
            this.analytics.set(result.analytics);
            this.forecasts.set(result.forecasts);
          } else this.overview.set(data as FleetOverview);
        },
        error: () =>
          this.feedback.toast('Unable to load fleet intelligence data. Please try again.', 'error'),
      });
  }

  saveMaintenance(): void {
    if (this.maintenanceForm.invalid || this.saving()) return;
    const vehicle = this.selectedVehicle();
    if (!vehicle) return;
    const value = this.maintenanceForm.getRawValue();
    this.saving.set(true);
    this.api
      .createMaintenance({
        vehicleRef: `${vehicle.vehicleType ?? 'CAR'}:${Math.abs(vehicle.carId)}`,
        vehicleType: vehicle.vehicleType ?? 'CAR',
        registrationNumber: vehicle.regNo,
        maintenanceType: value.maintenanceType,
        description: value.description,
        scheduledDate: value.scheduledDate,
        odometerReading: value.odometerReading,
        estimatedCost: value.estimatedCost || null,
        serviceProvider: value.serviceProvider || null,
        status: 'SCHEDULED',
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.feedback.toast('Maintenance record created successfully.');
          this.maintenanceOpen.set(false);
          this.maintenanceForm.reset();
          this.load();
        },
        error: () =>
          this.feedback.toast(
            'Unable to create the maintenance record. Please try again.',
            'error',
          ),
      });
  }

  sendSimulation(): void {
    if (this.simulationForm.invalid || this.saving()) return;
    const value = this.simulationForm.getRawValue();
    const vehicle = this.vehicles().find((item) => String(item.carId) === value.vehicleId);
    if (!vehicle) return;
    this.saving.set(true);
    this.api
      .simulate({
        vehicleRef: `${vehicle.vehicleType ?? 'CAR'}:${Math.abs(vehicle.carId)}`,
        vehicleType: vehicle.vehicleType ?? 'CAR',
        registrationNumber: vehicle.regNo,
        latitude: value.latitude,
        longitude: value.longitude,
        speed: value.speed,
        recordedAt: new Date().toISOString(),
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.feedback.toast('Simulated location added.');
          this.simulationOpen.set(false);
          this.load();
        },
        error: () => this.feedback.toast('Unable to add the simulated location.', 'error'),
      });
  }

  acknowledge(alert: FleetAlert): void {
    this.api.acknowledge(alert.id).subscribe({
      next: () => {
        this.feedback.toast('Alert acknowledged successfully.');
        this.load();
      },
      error: () => this.feedback.toast('Unable to acknowledge the alert. Please retry after refreshing.', 'error'),
    });
  }

  saveGeofence(): void {
    if (this.geofenceForm.invalid || this.saving()) return;
    this.saving.set(true);
    this.api
      .createGeofence({ ...this.geofenceForm.getRawValue(), status: 'ACTIVE' })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.feedback.toast('Geofence created successfully.');
          this.geofenceOpen.set(false);
          this.geofenceForm.reset({
            centerLatitude: 20.5937,
            centerLongitude: 78.9629,
            radiusMeters: 500,
            name: '',
            description: '',
          });
          this.load();
        },
        error: () => this.feedback.toast('Unable to create the geofence.', 'error'),
      });
  }

  closePanels(): void {
    if (this.saving()) return;
    this.maintenanceOpen.set(false);
    this.simulationOpen.set(false);
    this.geofenceOpen.set(false);
  }
}
