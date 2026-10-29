import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { endpoints } from '../config/api.config';
import { DashboardData } from '../models/api.models';
import { map } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);
  get() {
    return this.api.get<DashboardData[]>(endpoints.dashboard).pipe(
      map((rows) => {
        if (!rows?.length) throw new Error('Dashboard statistics are unavailable.');
        return rows[0];
      }),
    );
  }
}
