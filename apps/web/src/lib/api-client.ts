/**
 * Typed API client for the Instant Mechanic backend.
 *
 * Uses the native fetch API. All methods return typed data or throw
 * on non-OK responses. No axios dependency needed for Phase 1.
 */

import type {
  ApiResponse,
  ApiError,
  PaginatedResult,
  DashboardMetrics,
  DashboardFullDto,
  Booking,
  Mechanic,
  Customer,
  Service,
} from '@/types/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const API_V1 = `${BASE_URL}/api/v1`;

class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiError,
  ) {
    super(typeof body.message === 'string' ? body.message : body.message.join(', '));
    this.name = 'ApiClientError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_V1}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const errorBody = (await res.json()) as ApiError;
    throw new ApiClientError(res.status, errorBody);
  }

  const envelope = (await res.json()) as ApiResponse<T>;
  return envelope.data;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardApi = {
  // The backend currently returns a richer envelope under `data` with a
  // `summary` object and other fields. Map that shape to the `DashboardMetrics`
  // type expected by the UI so components can read `bookings.total`, etc.
  // Return the full dashboard DTO so the UI can render charts and summaries.
  getMetrics: async (): Promise<DashboardFullDto> => {
    const resp = await request<DashboardFullDto>('/dashboard/metrics');
    return resp;
  },
};

// ─── Bookings ─────────────────────────────────────────────────────────────────

export const bookingsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<PaginatedResult<Booking>>(`/bookings${qs}`);
  },
  getById: (id: string) => request<Booking>(`/bookings/${id}`),
  create: (body: unknown) =>
    request<Booking>('/bookings', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: unknown) =>
    request<Booking>(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
};

// ─── Mechanics ────────────────────────────────────────────────────────────────

export const mechanicsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<Mechanic[]>(`/mechanics${qs}`);
  },
  getById: (id: string) => request<Mechanic>(`/mechanics/${id}`),
  create: (body: unknown) =>
    request<Mechanic>('/mechanics', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: unknown) =>
    request<Mechanic>(`/mechanics/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
};

// ─── Customers ────────────────────────────────────────────────────────────────

export const customersApi = {
  list: () => request<Customer[]>('/customers'),
  getById: (id: string) => request<Customer>(`/customers/${id}`),
  create: (body: unknown) =>
    request<Customer>('/customers', { method: 'POST', body: JSON.stringify(body) }),
};

// ─── Services ─────────────────────────────────────────────────────────────────

export const servicesApi = {
  list: () => request<Service[]>('/services'),
};

export { ApiClientError };
