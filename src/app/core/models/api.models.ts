export interface ApiResponse<T> {
  message: string;
  result: boolean;
  data: T;
}
export interface Vehicle {
  carId: number;
  brand: string;
  model: string;
  year: number;
  color: string | null;
  dailyRate: number;
  carImage: string | null;
  regNo: string;
  vehicleType?: 'CAR' | 'BIKE';
  available?: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}
export interface BikeApiModel {
  id: number;
  brand: string;
  model: string;
  year: number;
  color: string | null;
  dailyRate: number;
  image: string | null;
  registrationNumber: string;
  available: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}
export interface Customer {
  customerId: number;
  customerName: string;
  customerCity: string | null;
  mobileNo: string | null;
  email: string | null;
}
export interface Booking {
  bookingId: number;
  bookingDate: string;
  discount: number;
  totalBillAmount: number;
  customerName: string;
  mobileNo: string | null;
  brand: string;
  model: string;
  bookingUid?: string;
  carId?: number;
  customerId?: number;
  email?: string;
  customerCity?: string;
}
export interface CreateBooking {
  bookingId: number;
  carId: number;
  bookingDate: string;
  discount: number;
  totalBillAmount: number;
  customerName: string;
  customerCity: string;
  mobileNo: string;
  email: string;
}
export interface BookingFilter {
  mobileNo: string;
  customerName: string;
  carId: number;
  fromBookingDate: string;
  toBookingDate: string;
}
export interface DashboardData {
  totalCars: number;
  totalCustomers: number;
  totalBookings: number;
  todaysBooking: number;
  todayTotalAmount: number;
  totalAmount: number;
}
export interface Profile {
  name: string;
  email: string;
  phone: string;
  imageUrl: string | null;
}
export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
  profileImage: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}
