/**
 * Shared API response types — mirrors the NestJS response shapes.
 * Keep in sync with backend DTOs. In Phase 2+, consider auto-generating from OpenAPI spec.
 */

// ─── Envelope ─────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// ─── Enums ────────────────────────────────────────────────────────────────────

export type BookingStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'MECHANIC_ON_THE_WAY'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type MechanicSpecialization =
  | 'GENERAL'
  | 'ENGINE'
  | 'TRANSMISSION'
  | 'ELECTRICAL'
  | 'BRAKES'
  | 'TYRES'
  | 'AC_HEATING'
  | 'DIAGNOSTICS'
  | 'BODYWORK'
  | 'OIL_CHANGE';

// ─── Domain types ──────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin?: string;
  color?: string;
  mileage?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Mechanic {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specializations: MechanicSpecialization[];
  isAvailable: boolean;
  isActive: boolean;
  rating?: number;
  totalJobs: number;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  iconSlug?: string;
}

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  basePrice: string; // Decimal serialized as string
  estimatedDuration: number; // minutes
  isActive: boolean;
  category?: ServiceCategory;
}

export interface Booking {
  id: string;
  customerId: string;
  vehicleId: string;
  mechanicId?: string;
  serviceId: string;
  status: BookingStatus;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  notes?: string;
  internalNotes?: string;
  totalAmount?: string; // Decimal as string
  rating?: number;
  createdAt: string;
  updatedAt: string;
  // Relations (included in detail views)
  customer?: Customer;
  vehicle?: Vehicle;
  mechanic?: Mechanic;
  service?: Service;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  bookings: {
    total: number;
    today: number;
    byStatus: Record<BookingStatus, number>;
    pendingUnassigned: number;
  };
  mechanics: {
    total: number;
    available: number;
    busy: number;
  };
  customers: {
    total: number;
    newThisMonth: number;
  };
  revenue: {
    today: number;
    thisMonth: number;
  };
}
