"use client";

import React, { useEffect, useState } from 'react';
import { mechanicsApi } from '@/lib/api-client';
import type { Mechanic, MechanicDetail } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { SkeletonTableRows } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';

export default function MechanicsClient(): JSX.Element {
  const [data, setData] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [isAvailable, setIsAvailable] = useState<string>('');
  const [selectedMechanicId, setSelectedMechanicId] = useState<string | null>(null);
  const [selectedMechanic, setSelectedMechanic] = useState<MechanicDetail | null>(null as MechanicDetail | null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editAvailable, setEditAvailable] = useState<boolean | undefined>(undefined);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (isAvailable !== '') params.isAvailable = isAvailable;
      const resp = await mechanicsApi.list(params);
      setData(resp);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async (id: string) => {
    setDetailLoading(true);
    try {
      const mech = await mechanicsApi.getById(id);
      setSelectedMechanic(mech);
      setEditAvailable(mech.isAvailable ?? undefined);
    } catch (e: unknown) {
      // eslint-disable-next-line no-console
      console.error('Failed to load mechanic', e);
      setSelectedMechanic(null);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAvailable]);

  useEffect(() => {
    if (selectedMechanicId) fetchDetails(selectedMechanicId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMechanicId]);

  const toast = useToast();

  const filtered = q ? data.filter((m) => `${m.firstName} ${m.lastName}`.toLowerCase().includes(q.toLowerCase())) : data;

  return (
    <>
      <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Mechanics</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <input placeholder="Search mechanics" value={q} onChange={(e) => setQ(e.target.value)} className="rounded-md bg-background border px-3 py-2 text-sm" />
            <select value={isAvailable} onChange={(e) => setIsAvailable(e.target.value)} className="rounded-md bg-background border px-3 py-2 text-sm">
              <option value="">All</option>
              <option value="true">Available</option>
              <option value="false">Not available</option>
            </select>
            <Button size="sm" onClick={() => fetch()}>Refresh</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="p-6"><SkeletonTableRows rows={6} cols={3} /></div>
        ) : error ? (
          <div className="p-6 text-destructive">Error: {error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-muted-foreground">No mechanics found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((m) => (
              <div key={m.id} className="rounded-md border p-4 hover:shadow cursor-pointer" onClick={() => setSelectedMechanicId(m.id)}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{m.firstName} {m.lastName}</div>
                    <div className="text-sm text-muted-foreground">Rating: {m.rating ?? '—'}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{m.isAvailable ? 'Available' : 'Not available'}</div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">Completed jobs: {m.totalJobs ?? 0}</div>
                {/* Mechanics list endpoint doesn't include bookings; details API provides bookings. */}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
    {/* Mechanic details drawer */}
    {selectedMechanicId && (
      <div className="fixed inset-0 z-50 flex">
        <div className="absolute inset-0 bg-black/40" onClick={() => { setSelectedMechanicId(null); setSelectedMechanic(null); }} />
        <div className="relative ml-auto w-full max-w-2xl bg-card text-card-foreground h-full overflow-auto shadow-xl">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-semibold">Mechanic Details</h3>
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={() => { setSelectedMechanicId(null); setSelectedMechanic(null); }}>Close</Button>
            </div>
          </div>
          <div className="p-6">
            {detailLoading ? (
              <div><SkeletonTableRows rows={4} cols={2} /></div>
            ) : selectedMechanic ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Name</div>
                    <div className="font-semibold">{selectedMechanic.firstName} {selectedMechanic.lastName}</div>
                    <div className="text-sm text-muted-foreground mt-2">Phone: {selectedMechanic.phone}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Rating</div>
                    <div className="font-semibold">{selectedMechanic.rating ?? '—'}</div>
                    <div className="text-sm text-muted-foreground mt-2">Completed jobs</div>
                    <div className="font-semibold">{selectedMechanic.totalJobs ?? 0}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Availability</div>
                  <div className="mt-1">
                    <select aria-label="Change availability" value={String(editAvailable ?? '')} onChange={(e) => setEditAvailable(e.target.value === '' ? undefined : e.target.value === 'true')} className="rounded-md bg-background border px-3 py-2 text-sm">
                      <option value="">(unchanged)</option>
                      <option value="true">Available</option>
                      <option value="false">Not available</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Assigned / Active Bookings</div>
                  {selectedMechanic.bookings && selectedMechanic.bookings.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {selectedMechanic.bookings.map((b) => (
                        <div key={b.id} className="rounded-md border p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-mono text-xs">{b.id}</div>
                              <div className="font-medium">{b.customer ? `${b.customer.firstName} ${b.customer.lastName}` : '—'}</div>
                              <div className="text-sm text-muted-foreground">{b.service?.name ?? '—'}</div>
                            </div>
                            <div className="text-sm text-muted-foreground text-right">
                              <div>{b.status}</div>
                              <div className="mt-1">{b.scheduledAt ? formatDate(b.scheduledAt) : '—'}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    ) : (
                    <div className="p-2 text-sm text-muted-foreground">No active bookings.</div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button size="sm" onClick={async () => {
                    if (!selectedMechanic) return;
                    setUpdating(true);
                    try {
                      const body: Record<string, unknown> = {};
                      if (editAvailable !== undefined && editAvailable !== selectedMechanic.isAvailable) body.isAvailable = editAvailable;
                      if (Object.keys(body).length === 0) {
                        setUpdating(false);
                        return;
                      }
                      const updated = await mechanicsApi.update(selectedMechanic.id, body);
                      setSelectedMechanic(updated as MechanicDetail);
                      // refresh list
                      fetch();
                      toast.push({ type: 'success', title: 'Mechanic updated', description: 'Availability updated' });
                    } catch (err) {
                      // eslint-disable-next-line no-console
                      console.error('Update mechanic failed', err);
                      toast.push({ type: 'error', title: 'Update failed', description: err instanceof Error ? err.message : String(err) });
                    } finally {
                      setUpdating(false);
                    }
                  }} disabled={updating}>{updating ? 'Saving…' : 'Save'}</Button>
                  <Button variant="outline" size="sm" onClick={() => { setSelectedMechanicId(null); setSelectedMechanic(null); }}>Close</Button>
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
