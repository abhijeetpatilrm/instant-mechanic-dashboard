"use client";

import React, { useEffect, useState } from 'react';
import { customersApi } from '@/lib/api-client';
import type { Customer } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonTableRows } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';

export default function CustomersClient(): JSX.Element {
  const [data, setData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await customersApi.list();
      setData(resp);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toast = useToast();

  const fetchDetails = async (id: string) => {
    setDetailLoading(true);
    try {
      const c = await customersApi.getById(id);
      setSelectedCustomer(c);
    } catch (e: unknown) {
      toast.push({ type: 'error', title: 'Failed to load customer', description: e instanceof Error ? e.message : String(e) });
      setSelectedCustomer(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = q ? data.filter((c) => `${c.firstName} ${c.lastName}`.toLowerCase().includes(q.toLowerCase())) : data;

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Customers</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <input placeholder="Search customers" value={q} onChange={(e) => setQ(e.target.value)} className="rounded-md bg-background border px-3 py-2 text-sm" />
            <Button size="sm" onClick={() => fetch()}>Refresh</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="p-6"><SkeletonTableRows rows={6} cols={4} /></div>
        ) : error ? (
          <div className="p-6 text-destructive">Error: {error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-muted-foreground">No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Vehicles</th>
                  <th className="px-3 py-2">Bookings</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-accent/50 cursor-pointer" onClick={() => { setSelectedCustomerId(c.id); fetchDetails(c.id); }}>
                    <td className="px-3 py-2">{c.firstName} {c.lastName}</td>
                    <td className="px-3 py-2">{c.phone ?? '—'}</td>
                    <td className="px-3 py-2">{c.vehicles && c.vehicles.length > 0 ? c.vehicles.map((v) => `${v.make} ${v.model} (${v.licensePlate})`).join(', ') : '—'}</td>
                    <td className="px-3 py-2">{c._count?.bookings ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
    {/* Customer detail drawer */}
    {selectedCustomerId && (
      <div className="fixed inset-0 z-50 flex">
        <div className="absolute inset-0 bg-black/40" onClick={() => { setSelectedCustomerId(null); setSelectedCustomer(null); }} />
        <div className="relative ml-auto w-full max-w-2xl bg-card text-card-foreground h-full overflow-auto shadow-xl">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-semibold">Customer Details</h3>
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={() => { setSelectedCustomerId(null); setSelectedCustomer(null); }}>Close</Button>
            </div>
          </div>
          <div className="p-6">
            {detailLoading ? (
              <SkeletonTableRows rows={4} cols={2} />
            ) : selectedCustomer ? (
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Name</div>
                  <div className="font-medium">{selectedCustomer.firstName} {selectedCustomer.lastName}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Phone</div>
                  <div>{selectedCustomer.phone ?? '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Vehicles</div>
                  <div>{selectedCustomer.vehicles && selectedCustomer.vehicles.length > 0 ? selectedCustomer.vehicles.map(v => `${v.make} ${v.model} — ${v.licensePlate}`).join(', ') : '—'}</div>
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
