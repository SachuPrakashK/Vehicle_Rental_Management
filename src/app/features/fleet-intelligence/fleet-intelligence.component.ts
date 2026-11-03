import { CurrencyPipe, DatePipe, DOCUMENT, NgClass } from '@angular/common';
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
import { catchError, finalize, forkJoin, of, type Observable } from 'rxjs';
import type { Vehicle } from '../../core/models/api.models';
import { FeedbackService } from '../../core/services/feedback.service';
import { PermissionService } from '../../core/services/permission.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
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
import { FleetMapComponent } from './fleet-map.component';
import { FleetDatePipe } from './fleet-date.pipe';
import { FleetStatusClassPipe } from './fleet-status-class.pipe';
import { FleetStatusPipe } from './fleet-status.pipe';

type FleetSection =
  'overview' | 'maintenance' | 'health' | 'tracking' | 'geofences' | 'alerts' | 'analytics';

type FleetConfirmation =
  | { kind: 'deleteGeofence'; geofence: FleetGeofence }
  | { kind: 'deleteMaintenance'; record: MaintenanceRecord }
  | { kind: 'acknowledgeAlert'; alert: FleetAlert };

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
    ModalComponent,
    FleetMapComponent,
    FleetDatePipe,
    FleetStatusPipe,
    FleetStatusClassPipe,
    NgClass,
    CurrencyPipe,
    DatePipe,
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
  readonly editingMaintenance = signal<MaintenanceRecord | null>(null);
  readonly editingGeofence = signal<FleetGeofence | null>(null);
  readonly maintenanceDetails = signal<MaintenanceRecord | null>(null);
  readonly geofenceDetails = signal<FleetGeofence | null>(null);
  readonly confirmation = signal<FleetConfirmation | null>(null);
  readonly selectedVehicle = computed(() =>
    this.vehicles().find(
      (vehicle) => String(vehicle.carId) === this.maintenanceForm.controls.vehicleId.value,
    ),
  );
  readonly maintenanceForm = this.fb.nonNullable.group({
    vehicleId: ['', Validators.required],
    maintenanceType: ['', Validators.required],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    scheduledDate: ['', Validators.required],
    odometerReading: [0, [Validators.required, Validators.min(0)]],
    estimatedCost: [0, Validators.min(0)],
    serviceProvider: [''],
    status: ['SCHEDULED', Validators.required],
    notes: ['', Validators.maxLength(1000)],
  });
  readonly simulationForm = this.fb.nonNullable.group({
    vehicleId: ['', Validators.required],
    latitude: [20.5937, [Validators.required, Validators.min(-90), Validators.max(90)]],
    longitude: [78.9629, [Validators.required, Validators.min(-180), Validators.max(180)]],
    speed: [0, [Validators.min(0), Validators.max(300)]],
  });
  readonly geofenceForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(500)],
    centerLatitude: [20.5937, [Validators.required, Validators.min(-90), Validators.max(90)]],
    centerLongitude: [78.9629, [Validators.required, Validators.min(-180), Validators.max(180)]],
    radiusMeters: [500, [Validators.required, Validators.min(50), Validators.max(100000)]],
    status: ['ACTIVE', Validators.required],
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
        section === 'maintenance' || section === 'tracking'
          ? this.vehicleApi.list().pipe(catchError(() => of([] as Vehicle[])))
          : of([]),
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
    const value = this.maintenanceForm.getRawValue();
    const editing = this.editingMaintenance();
    const vehicle = this.selectedVehicle();
    if (!editing && !vehicle) return;
    const request = {
      maintenanceType: value.maintenanceType,
      description: value.description,
      scheduledDate: `${value.scheduledDate}T00:00:00.000Z`,
      odometerReading: value.odometerReading,
      estimatedCost: value.estimatedCost || null,
      serviceProvider: value.serviceProvider || null,
      status: value.status,
      notes: value.notes || null,
    };
    this.saving.set(true);
    const operation = editing
      ? this.api.updateMaintenance(editing.id, request)
      : this.api.createMaintenance({
          ...request,
          vehicleRef: `${vehicle!.vehicleType ?? 'CAR'}:${Math.abs(vehicle!.carId)}`,
          vehicleType: vehicle!.vehicleType ?? 'CAR',
          registrationNumber: vehicle!.regNo,
        });
    operation.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.feedback.toast(
          editing
            ? 'Maintenance record updated successfully.'
            : 'Maintenance record created successfully.',
        );
        this.maintenanceOpen.set(false);
        this.editingMaintenance.set(null);
        this.resetMaintenanceForm();
        this.load();
      },
      error: () =>
        this.feedback.toast(
          editing
            ? 'Unable to update the maintenance record. Please try again.'
            : 'Unable to create the maintenance record. Please try again.',
          'error',
        ),
    });
  }

  openMaintenanceCreate(): void {
    this.editingMaintenance.set(null);
    this.resetMaintenanceForm();
    this.maintenanceOpen.set(true);
  }

  handleMaintenanceAction(event: { action: string; record: MaintenanceRecord }): void {
    if (event.action === 'view') {
      this.api.maintenanceById(event.record.id).subscribe({
        next: (record) => this.maintenanceDetails.set(record),
        error: () => this.feedback.toast('Unable to load maintenance details.', 'error'),
      });
      return;
    }
    if (event.action === 'edit') {
      if (event.record.status === 'COMPLETED') {
        this.feedback.toast(
          'Completed maintenance records are retained as read-only history.',
          'info',
        );
        return;
      }
      this.editingMaintenance.set(event.record);
      this.maintenanceForm.reset({
        vehicleId: event.record.vehicleRef,
        maintenanceType: event.record.maintenanceType,
        description: event.record.description,
        scheduledDate: event.record.scheduledDate.slice(0, 10),
        odometerReading: event.record.odometerReading ?? 0,
        estimatedCost: event.record.estimatedCost ?? 0,
        serviceProvider: event.record.serviceProvider ?? '',
        status: event.record.status,
        notes: event.record.notes ?? '',
      });
      this.maintenanceOpen.set(true);
      return;
    }
    if (event.action === 'delete')
      this.confirmation.set({ kind: 'deleteMaintenance', record: event.record });
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

  requestAcknowledge(alert: FleetAlert): void {
    if (alert.status !== 'OPEN') {
      this.feedback.toast('This alert has already changed status. Refresh the list.', 'warning');
      return;
    }
    this.confirmation.set({ kind: 'acknowledgeAlert', alert });
  }

  saveGeofence(): void {
    if (this.geofenceForm.invalid || this.saving()) return;
    this.saving.set(true);
    const editing = this.editingGeofence();
    const operation = editing
      ? this.api.updateGeofence(editing.id, this.geofenceForm.getRawValue())
      : this.api.createGeofence(this.geofenceForm.getRawValue());
    operation.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.feedback.toast(
          editing ? 'Geofence updated successfully.' : 'Geofence created successfully.',
        );
        this.geofenceOpen.set(false);
        this.editingGeofence.set(null);
        this.resetGeofenceForm();
        this.load();
      },
      error: () =>
        this.feedback.toast(
          editing ? 'Unable to update the geofence.' : 'Unable to create the geofence.',
          'error',
        ),
    });
  }

  openGeofenceCreate(): void {
    this.editingGeofence.set(null);
    this.resetGeofenceForm();
    this.geofenceOpen.set(true);
  }

  handleGeofenceAction(event: { action: string; geofence: FleetGeofence }): void {
    if (event.action === 'view') {
      this.api.geofenceById(event.geofence.id).subscribe({
        next: (geofence) => this.geofenceDetails.set(geofence),
        error: () => this.feedback.toast('Unable to load geofence details.', 'error'),
      });
      return;
    }
    if (event.action === 'edit') {
      this.editingGeofence.set(event.geofence);
      this.geofenceForm.reset({
        name: event.geofence.name,
        description: event.geofence.description ?? '',
        centerLatitude: event.geofence.centerLatitude,
        centerLongitude: event.geofence.centerLongitude,
        radiusMeters: event.geofence.radiusMeters,
        status: event.geofence.status,
      });
      this.geofenceOpen.set(true);
      return;
    }
    if (event.action === 'delete')
      this.confirmation.set({ kind: 'deleteGeofence', geofence: event.geofence });
  }

  confirmFleetAction(): void {
    const confirmation = this.confirmation();
    if (!confirmation || this.saving()) return;
    this.saving.set(true);
    let operation: Observable<unknown>;
    if (confirmation.kind === 'deleteGeofence')
      operation = this.api.deleteGeofence(confirmation.geofence.id);
    else if (confirmation.kind === 'deleteMaintenance')
      operation = this.api.deleteMaintenance(confirmation.record.id);
    else operation = this.api.acknowledge(confirmation.alert.id);
    operation.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        const message =
          confirmation.kind === 'deleteGeofence'
            ? 'Geofence deleted successfully.'
            : confirmation.kind === 'deleteMaintenance'
              ? 'Maintenance record deleted successfully.'
              : 'Fleet alert acknowledged successfully.';
        this.feedback.toast(message);
        this.confirmation.set(null);
        this.load();
      },
      error: () => {
        const message =
          confirmation.kind === 'deleteGeofence'
            ? 'Unable to delete the geofence.'
            : confirmation.kind === 'deleteMaintenance'
              ? 'Unable to delete the maintenance record.'
              : 'Unable to acknowledge the alert. Refresh and try again.';
        this.feedback.toast(message, 'error');
      },
    });
  }

  private resetMaintenanceForm(): void {
    this.maintenanceForm.reset({
      vehicleId: '',
      maintenanceType: '',
      description: '',
      scheduledDate: '',
      odometerReading: 0,
      estimatedCost: 0,
      serviceProvider: '',
      status: 'SCHEDULED',
      notes: '',
    });
  }

  private resetGeofenceForm(): void {
    this.geofenceForm.reset({
      centerLatitude: 20.5937,
      centerLongitude: 78.9629,
      radiusMeters: 500,
      name: '',
      description: '',
      status: 'ACTIVE',
    });
  }

  closePanels(): void {
    if (this.saving()) return;
    this.maintenanceOpen.set(false);
    this.simulationOpen.set(false);
    this.geofenceOpen.set(false);
    this.editingMaintenance.set(null);
    this.editingGeofence.set(null);
    this.maintenanceDetails.set(null);
    this.geofenceDetails.set(null);
    this.confirmation.set(null);
  }
}
