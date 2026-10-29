import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { endpoints } from '../config/api.config';
import { Booking, BookingFilter, CreateBooking } from '../models/api.models';
@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly api = inject(ApiService);
  list() {
    return this.api.get<Booking[]>(endpoints.bookings);
  }
  forCustomer(id: number) {
    return this.api.get<Booking[]>(endpoints.customerBookings, { custId: id });
  }
  get(id: number) {
    return this.api.get<Booking | Booking[]>(endpoints.booking, { bookingId: id });
  }
  filter(filter: BookingFilter) {
    return this.api.post<Booking[]>(endpoints.filterBookings, filter);
  }
  create(booking: CreateBooking) {
    return this.api.post<Booking | null>(endpoints.createBooking, booking);
  }
  delete(id: number) {
    return this.api.delete(endpoints.deleteBooking, { id });
  }
}
