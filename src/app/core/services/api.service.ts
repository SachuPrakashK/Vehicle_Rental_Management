import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
export class ApiError extends Error {}
export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (!response || typeof response.result !== 'boolean')
    throw new ApiError('Unable to complete the request. Please try again.');
  if (!response.result) throw new ApiError('Unable to complete the request. Please try again.');
  return response.data;
}
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  get<T>(path: string, params: Record<string, string | number> = {}): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(environment.apiBaseUrl + path, { params })
      .pipe(map(unwrapResponse));
  }
  post<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(environment.apiBaseUrl + path, body)
      .pipe(map(unwrapResponse));
  }
  put<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(environment.apiBaseUrl + path, body)
      .pipe(map(unwrapResponse));
  }
  delete(path: string, params: Record<string, number>): Observable<unknown> {
    return this.http
      .delete<ApiResponse<unknown>>(environment.apiBaseUrl + path, { params })
      .pipe(map(unwrapResponse));
  }
}
