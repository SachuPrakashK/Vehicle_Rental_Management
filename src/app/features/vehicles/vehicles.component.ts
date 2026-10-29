import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { VehicleService } from '../../core/services/vehicle.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { Vehicle } from '../../core/models/api.models';
import { ListState } from '../../shared/utils/list-state';
import { showMutationError } from '../../shared/utils/mutation-error';
import { httpsValidator, nonBlank, validateVehicleImage } from '../../shared/utils/validators';
import { IconComponent } from '../../shared/icons/icon.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { DrawerComponent } from '../../shared/components/drawer/drawer.component';
import { FieldErrorComponent } from '../../shared/components/field-error/field-error.component';
import { environment } from '../../../environments/environment';
import {
  ActionMenuComponent,
  ActionMenuItem,
} from '../../shared/components/action-menu/action-menu.component';
import { SearchComponent } from '../../shared/components/search/search.component';
@Component({
  selector: 'app-vehicles',
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    IconComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    PaginationComponent,
    DrawerComponent,
    FieldErrorComponent,
    ActionMenuComponent,
    SearchComponent,
  ],
  templateUrl: './vehicles.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehiclesComponent {
  private readonly service = inject(VehicleService);
  private readonly feedback = inject(FeedbackService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly yearFilter = signal('');
  readonly typeFilter = signal('');
  readonly currency = environment.currency;
  readonly list = new ListState(
    () => this.service.list(),
    (vehicle, query) =>
      [vehicle.brand, vehicle.model, vehicle.regNo, vehicle.color]
        .join(' ')
        .toLowerCase()
        .includes(query) &&
      (!this.yearFilter() || String(vehicle.year) === this.yearFilter()) &&
      (!this.typeFilter() || (vehicle.vehicleType ?? 'CAR') === this.typeFilter()),
  );
  readonly open = signal(false);
  readonly viewing = signal(false);
  readonly selected = signal<Vehicle | null>(null);
  readonly busy = signal(false);
  readonly imageBusy = signal(false);
  readonly imageFile = signal<File | null>(null);
  readonly imagePreview = signal<string | null>(null);
  readonly deleting = signal<number | null>(null);
  readonly rowActions: ActionMenuItem[] = [
    { id: 'view', label: 'View', icon: 'view' },
    { id: 'edit', label: 'Edit', icon: 'edit' },
    { id: 'delete', label: 'Delete', icon: 'delete', destructive: true },
  ];
  readonly drawer = viewChild(DrawerComponent);
  readonly form = this.fb.nonNullable.group({
    carId: [0],
    vehicleType: ['CAR' as 'CAR' | 'BIKE'],
    brand: ['', [Validators.required, nonBlank, Validators.maxLength(80)]],
    model: ['', [Validators.required, nonBlank, Validators.maxLength(80)]],
    year: [
      new Date().getFullYear(),
      [
        Validators.required,
        Validators.min(1900),
        Validators.max(new Date().getFullYear() + 1),
        Validators.pattern(/^\d+$/),
      ],
    ],
    color: ['', Validators.maxLength(40)],
    dailyRate: [0, [Validators.required, Validators.min(0.01), Validators.max(100000000)]],
    regNo: ['', [Validators.required, nonBlank, Validators.maxLength(30)]],
    carImage: ['', [httpsValidator, Validators.maxLength(2048)]],
    available: [true],
    status: ['ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'],
  });
  constructor() {
    void this.initialize();
  }
  private async initialize(): Promise<void> {
    await this.list.load();
    const id = Number(this.route.snapshot.queryParamMap.get('view'));
    const vehicle = this.list.records().find((item) => item.carId === id);
    if (vehicle) this.edit(vehicle, true);
  }
  edit(vehicle?: Vehicle, view = false): void {
    this.clearSelectedImage();
    this.viewing.set(view);
    this.selected.set(vehicle || null);
    this.form.reset(
      vehicle
        ? {
            ...vehicle,
            vehicleType: vehicle.vehicleType ?? 'CAR',
            color: vehicle.color || '',
            carImage: vehicle.carImage || '',
            available: vehicle.available ?? true,
            status: vehicle.status ?? 'ACTIVE',
          }
        : {
            carId: 0,
            vehicleType: 'CAR',
            brand: '',
            model: '',
            year: new Date().getFullYear(),
            color: '',
            dailyRate: 0,
            regNo: '',
            carImage: '',
            available: true,
            status: 'ACTIVE',
          },
    );
    this.open.set(true);
  }
  years(): number[] {
    return [...new Set(this.list.records().map((vehicle) => vehicle.year))].sort((a, b) => b - a);
  }
  hasUnsavedChanges(): boolean {
    return this.busy() || (this.open() && !this.viewing() && this.form.dirty);
  }
  async save(): Promise<void> {
    if (this.busy()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.busy.set(true);
    const value = this.form.getRawValue();
    let vehicle = {
      ...value,
      brand: value.brand.trim(),
      model: value.model.trim(),
      regNo: value.regNo.trim(),
    };
    try {
      const image = this.imageFile();
      if (image) {
        this.imageBusy.set(true);
        const carImage = await firstValueFrom(this.service.uploadImage(image));
        vehicle = { ...vehicle, carImage };
        this.imageBusy.set(false);
      }
      await firstValueFrom(
        vehicle.carId ? this.service.update(vehicle) : this.service.create(vehicle),
      );
      this.feedback.toast(
        vehicle.carId ? 'Vehicle updated successfully.' : 'Vehicle created successfully.',
      );
      this.form.markAsPristine();
      this.clearSelectedImage();
      this.open.set(false);
      await this.list.load();
    } catch (error) {
      showMutationError(this.feedback, error);
    } finally {
      this.imageBusy.set(false);
      this.busy.set(false);
    }
  }
  async remove(vehicle: Vehicle): Promise<void> {
    if (
      this.deleting() !== null ||
      !(await this.feedback.confirm(
        'Delete vehicle?',
        'Delete ' + vehicle.brand + ' ' + vehicle.model + '? This cannot be undone.',
      ))
    )
      return;
    this.deleting.set(vehicle.carId);
    try {
      await firstValueFrom(this.service.delete(vehicle.carId, vehicle.vehicleType));
      this.feedback.toast('Vehicle deleted successfully.');
      await this.list.load();
    } catch (error) {
      showMutationError(this.feedback, error);
    } finally {
      this.deleting.set(null);
    }
  }
  vehicleAction(action: string, vehicle: Vehicle): void {
    if (action === 'view') this.viewVehicle(vehicle);
    if (action === 'edit') this.edit(vehicle);
    if (action === 'delete') void this.remove(vehicle);
  }
  viewVehicle(vehicle: Vehicle, event?: Event): void {
    event?.preventDefault();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view: vehicle.carId },
      queryParamsHandling: 'merge',
    });
    this.edit(vehicle, true);
  }
  imageUrl(vehicle: Vehicle): string {
    try {
      if (vehicle.carImage?.startsWith('/')) return vehicle.carImage;
      return vehicle.carImage && new URL(vehicle.carImage).protocol === 'https:'
        ? vehicle.carImage
        : 'fleet-illustration.svg';
    } catch {
      return 'fleet-illustration.svg';
    }
  }
  imageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.onerror = null;
    image.src = 'fleet-illustration.svg';
  }
  selectImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const error = validateVehicleImage(file);
    if (error) {
      this.feedback.toast(error, 'error');
      input.value = '';
      return;
    }
    this.clearSelectedImage();
    this.imageFile.set(file);
    this.imagePreview.set(URL.createObjectURL(file));
    this.form.markAsDirty();
  }
  clearSelectedImage(): void {
    const preview = this.imagePreview();
    if (preview) URL.revokeObjectURL(preview);
    this.imageFile.set(null);
    this.imagePreview.set(null);
  }
  cancel(): void {
    void this.drawer()?.close();
  }
  closeDrawer(): void {
    this.open.set(false);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
