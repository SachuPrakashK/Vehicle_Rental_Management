export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  profileImage: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  roles?: RoleSummary[];
  permissions?: string[];
}
export interface RoleSummary {
  id: string;
  name: string;
  code: string;
}
export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}
export interface AuthorizationSnapshot {
  roles: RoleSummary[];
  permissions: string[];
}
export interface AuthApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]> | Array<{ field: string; message: string }>;
}
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}
export interface LoginRequest {
  email: string;
  password: string;
}
