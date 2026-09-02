"use client";

import React, { useEffect, useState } from 'react';
import { bookingsApi, mechanicsApi } from '@/lib/api-client';
import type { Booking } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getStatusColor, formatStatus, formatDate } from '@/lib/utils';
import { SkeletonTableRows } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';

export default function BookingsClient(): JSX.Element {
  const [data, setData] = useState<Booking[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [mechanics, setMechanics] = useState<import('@/types/api').Mechanic[]>([]);
  const [updating, setUpdating] = useState(false);
  const [editStatus, setEditStatus] = useState<string | undefined>(undefined);
  const [editMechanicId, setEditMechanicId] = useState<string | undefined>(undefined);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (q && q.trim().length > 0) params.q = q.trim();
      if (status) params.status = status;
      const resp = await bookingsApi.list(params);
      setData(resp.data);
      setMeta(resp.meta);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async (id: string) => {
    setDetailLoading(true);
    try {
      const b = await bookingsApi.getById(id);
      setSelectedBooking(b);
      setEditStatus(b.status);
      setEditMechanicId(b.mechanicId ?? undefined);

      // fetch mechanics list for assignment
      const mechResp = await mechanicsApi.list({});
      setMechanics(mechResp);
    } catch (e: unknown) {
      // eslint-disable-next-line no-console
      console.error('Failed to load booking', e);
      setSelectedBooking(null);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q, status]);

  const toast = useToast();

  useEffect(() => {
    if (selectedBookingId) fetchDetails(selectedBookingId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBookingId]);

  return (
    <>
      <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Bookings</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <input
              placeholder="Search bookings, customer, plate, service"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="rounded-md bg-background border px-3 py-2 text-sm"
            />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md bg-background border px-3 py-2 text-sm">
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="MECHANIC_ON_THE_WAY">On The Way</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <Button size="sm" onClick={() => fetch()}>Refresh</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="p-6"><SkeletonTableRows rows={6} cols={8} /></div>
        ) : error ? (
          <div className="p-6 text-destructive">Error: {error}</div>
        ) : data.length === 0 ? (
          <div className="p-6 text-muted-foreground">No bookings found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Vehicle</th>
                  <th className="px-3 py-2">Service</th>
                  <th className="px-3 py-2">Mechanic</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Scheduled</th>
                </tr>
              </thead>
              <tbody>
                {data.map((b) => (
                  <tr key={b.id} className="hover:bg-accent/50 cursor-pointer" onClick={() => setSelectedBookingId(b.id)}>
                    <td className="px-3 py-2 text-sm font-mono text-xs">{b.id}</td>
                    <td className="px-3 py-2">{b.customer ? `${b.customer.firstName} ${b.customer.lastName}` : '—'}</td>
                    <td className="px-3 py-2">{b.vehicle ? `${b.vehicle.make} ${b.vehicle.model} — ${b.vehicle.licensePlate}` : '—'}</td>
                    <td className="px-3 py-2">{b.service?.name ?? '—'}</td>
                    <td className="px-3 py-2">{b.mechanic ? `${b.mechanic.firstName} ${b.mechanic.lastName}` : '—'}</td>
                    <td className="px-3 py-2">
                      <span className={`${getStatusColor(b.status)} inline-block px-2 py-1 rounded-full text-xs`}>{formatStatus(b.status)}</span>
                    </td>
                    <td className="px-3 py-2">{b.totalAmount ? `₹${b.totalAmount}` : '—'}</td>
                    <td className="px-3 py-2">{b.scheduledAt ? formatDate(b.scheduledAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div>Showing page {meta.page} of {meta.totalPages} — {meta.total} total</div>
            <div className="space-x-2">
              <Button size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={meta.page <= 1} aria-label="Previous page">Prev</Button>
              <Button size="sm" onClick={() => setPage((p) => (meta.page < meta.totalPages ? p + 1 : p))} disabled={!meta.hasNextPage} aria-label="Next page">Next</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
      {/* Booking details drawer/modal */}
      {selectedBookingId && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setSelectedBookingId(null); setSelectedBooking(null); }} />
          <div className="relative ml-auto w-full max-w-2xl bg-card text-card-foreground h-full overflow-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Booking Details</h3>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={() => { setSelectedBookingId(null); setSelectedBooking(null); }}>Close</Button>
              </div>
            </div>
            <div className="p-6">
              {detailLoading ? (
                <div>Loading…</div>
              ) : selectedBooking ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">ID</div>
                      <div className="font-mono">{selectedBooking.id}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Status</div>
                      <div className="mt-1">
                        <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="rounded-md bg-background border px-3 py-2 text-sm">
                          <option value="PENDING">Pending</option>
                          <option value="ASSIGNED">Assigned</option>
                          <option value="MECHANIC_ON_THE_WAY">On The Way</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Customer</div>
                      <div>{selectedBooking.customer ? `${selectedBooking.customer.firstName} ${selectedBooking.customer.lastName}` : '—'}</div>
                      <div className="text-sm text-muted-foreground mt-2">Phone</div>
                      <div>{selectedBooking.customer?.phone ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Vehicle</div>
                      <div>{selectedBooking.vehicle ? `${selectedBooking.vehicle.make} ${selectedBooking.vehicle.model} — ${selectedBooking.vehicle.licensePlate}` : '—'}</div>
                      <div className="text-sm text-muted-foreground mt-2">Service</div>
                      <div>{selectedBooking.service?.name ?? '—'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Scheduled</div>
                      <div>{selectedBooking.scheduledAt ? formatDate(selectedBooking.scheduledAt) : '—'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Amount</div>
                      <div>{selectedBooking.totalAmount ? `₹${selectedBooking.totalAmount}` : '—'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Assigned Mechanic</div>
                      <div className="mt-1">
                        <select value={editMechanicId ?? ''} onChange={(e) => setEditMechanicId(e.target.value || undefined)} className="rounded-md bg-background border px-3 py-2 text-sm">
                          <option value="">Unassigned</option>
                          {mechanics.map((m: any) => (
                            <option key={m.id} value={m.id}>{m.firstName} {m.lastName} {m.isAvailable ? '' : '(busy)'}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Notes</div>
                    <div className="whitespace-pre-wrap">{selectedBooking.notes ?? '—'}</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button size="sm" onClick={async () => {
                      if (!selectedBooking) return;
                      setUpdating(true);
                      try {
                        const body: Record<string, unknown> = {};
                        if (editStatus && editStatus !== selectedBooking.status) body.status = editStatus;
                        if (editMechanicId !== undefined && editMechanicId !== selectedBooking.mechanicId) body.mechanicId = editMechanicId ?? null;
                        if (Object.keys(body).length === 0) {
                          setUpdating(false);
                          return;
                        }
                        const updated = await bookingsApi.update(selectedBooking.id, body);
                        // update local state + table
                        setSelectedBooking(updated);
                        fetch();
                        toast.push({ type: 'success', title: 'Booking updated', description: 'Booking saved successfully' });
                      } catch (err) {
                        // eslint-disable-next-line no-console
                        console.error('Update failed', err);
                        toast.push({ type: 'error', title: 'Update failed', description: err instanceof Error ? err.message : String(err) });
                      } finally {
                        setUpdating(false);
                      }
                    }} disabled={updating}>{updating ? 'Saving…' : 'Save'}</Button>
                    <Button variant="outline" size="sm" onClick={() => { setSelectedBookingId(null); setSelectedBooking(null); }}>Close</Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No details available.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
