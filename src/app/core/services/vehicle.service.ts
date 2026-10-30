import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map } from 'rxjs';
import { ApiService } from './api.service';
import { endpoints } from '../config/api.config';
import { BikeApiModel, Vehicle } from '../models/api.models';
import { environment } from '../../../environments/environment';
import type { AuthApiResponse } from '../models/auth.models';
import { ImageUploadService } from './image-upload.service';
@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly imageUploads = inject(ImageUploadService);
  list() {
    return forkJoin({
      cars: this.api.get<Vehicle[]>(endpoints.vehicles),
      bikes: this.http
        .get<AuthApiResponse<BikeApiModel[]>>(environment.authApiBaseUrl + '/bikes', {
          withCredentials: true,
        })
        .pipe(map((response) => response.data)),
    }).pipe(
      map(({ cars, bikes }) => [
        ...cars.map((car) => ({
          ...car,
          vehicleType: 'CAR' as const,
          available: true,
          status: 'ACTIVE' as const,
        })),
        ...bikes.map((bike) => this.fromBike(bike)),
      ]),
    );
  }
  create(vehicle: Vehicle) {
    if (vehicle.vehicleType === 'BIKE')
      return this.http
        .post<AuthApiResponse<BikeApiModel>>(
          environment.authApiBaseUrl + '/bikes',
          this.toBike(vehicle),
          { withCredentials: true },
        )
        .pipe(map((response) => this.fromBike(response.data)));
    return this.api.post<Vehicle | null>(endpoints.createVehicle, vehicle);
  }
  update(vehicle: Vehicle) {
    if (vehicle.vehicleType === 'BIKE')
      return this.http
        .put<AuthApiResponse<BikeApiModel>>(
          environment.authApiBaseUrl + '/bikes/' + Math.abs(vehicle.carId),
          this.toBike(vehicle),
          { withCredentials: true },
        )
        .pipe(map((response) => this.fromBike(response.data)));
    return this.api.put<Vehicle | null>(endpoints.updateVehicle, vehicle);
  }
  delete(id: number, type: Vehicle['vehicleType'] = 'CAR') {
    if (type === 'BIKE')
      return this.http.delete<AuthApiResponse<null>>(
        environment.authApiBaseUrl + '/bikes/' + Math.abs(id),
        { withCredentials: true },
      );
    return this.api.delete(endpoints.deleteVehicle, { carid: id });
  }
  uploadImage(file: File) {
    if (environment.blobImageUploads)
      return this.imageUploads
        .upload(file, 'vehicle-images')
        .pipe(map((result) => (result as { url: string }).url));
    const body = new FormData();
    body.append('image', file);
    return this.http
      .post<AuthApiResponse<{ url: string }>>(
        environment.authApiBaseUrl + '/vehicles/images',
        body,
        { withCredentials: true },
      )
      .pipe(map((response) => response.data.url));
  }
  private fromBike(bike: BikeApiModel): Vehicle {
    return {
      carId: -bike.id,
      brand: bike.brand,
      model: bike.model,
      year: bike.year,
      color: bike.color,
      dailyRate: bike.dailyRate,
      carImage: bike.image,
      regNo: bike.registrationNumber,
      vehicleType: 'BIKE',
      available: bike.available,
      status: bike.status,
    };
  }
  private toBike(vehicle: Vehicle) {
    return {
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      dailyRate: vehicle.dailyRate,
      image: vehicle.carImage,
      registrationNumber: vehicle.regNo,
      available: vehicle.available ?? true,
      status: vehicle.status ?? 'ACTIVE',
    };
  }
}
