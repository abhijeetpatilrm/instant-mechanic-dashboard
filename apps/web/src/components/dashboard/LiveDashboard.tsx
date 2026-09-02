"use client";

import React, { useEffect, useRef, useState } from 'react';
import { dashboardApi } from '@/lib/api-client';
import type { DashboardFullDto } from '@/types/api';

const POLL_INTERVAL = 10_000; // 10 seconds

export default function LiveDashboard(): JSX.Element {
  const [data, setData] = useState<DashboardFullDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const inFlight = useRef(false);
  const timer = useRef<number | null>(null);

  const fetchMetrics = async (isInitial = false) => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (isInitial) {
      setLoading(true);
      setError(null);
    }
    try {
      const m = await dashboardApi.getMetrics();
      setData(m);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      inFlight.current = false;
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchMetrics(true);

    // Polling loop using setInterval but guarded to avoid overlapping requests
    timer.current = window.setInterval(() => {
      // Don't set loading on subsequent polls, keep UI responsive
      fetchMetrics(false);
    }, POLL_INTERVAL) as unknown as number;

    return () => {
      if (timer.current) {
        clearInterval(timer.current as number);
        timer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const liveIndicator = (
    <div className="flex items-center space-x-2">
      <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" aria-hidden />
      <span className="text-sm font-medium text-foreground">Live</span>
    </div>
  );

  function Sparkline({ points, height = 40 }: { points: number[]; height?: number }) {
    if (!points || points.length === 0) return <div className="text-sm text-muted-foreground">—</div>;
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = Math.max(1, max - min);
    const step = 100 / Math.max(1, points.length - 1);
    const path = points
      .map((p, i) => {
        const x = i * step;
        const y = ((max - p) / range) * height;
        return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
      })
      .join(' ');
    return (
      <svg viewBox={`0 0 100 ${height}`} className="w-full h-10">
        <path d={path} fill="none" stroke="rgba(34,197,94,0.9)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  function StatusBars({ map }: { map: Record<string, number> }) {
    const entries = Object.entries(map || {});
    const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
    return (
      <div className="space-y-2">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-center space-x-3">
            <div className="w-32 text-sm text-muted-foreground">{k}</div>
            <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
              <div style={{ width: `${(v / total) * 100}%` }} className="h-2 bg-emerald-500" />
            </div>
            <div className="w-12 text-right text-sm">{v}</div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div className="flex items-center space-x-4">
          {liveIndicator}
          <div className="text-sm text-muted-foreground">
            {lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : 'Not updated yet'}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {loading ? 'Loading…' : error ? `Error: ${error}` : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-sm text-muted-foreground">Bookings (total)</div>
          <div className="text-2xl font-bold">{loading ? '—' : data?.summary?.totalBookings ?? '—'}</div>
          <div className="text-sm text-muted-foreground">Today: {loading ? '—' : data?.summary?.todayBookings ?? '—'}</div>
          <div className="mt-3">
            <Sparkline points={(data?.revenueByDay ?? []).map(d => d.bookings)} />
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-card">
          <div className="text-sm text-muted-foreground">Mechanics (active)</div>
          <div className="text-2xl font-bold">{loading ? '—' : data?.summary?.activeMechanics ?? '—'}</div>
          <div className="text-sm text-muted-foreground">Available: {loading ? '—' : data?.summary?.availableMechanics ?? '—'}</div>
          <div className="mt-3">
            <div className="text-sm text-muted-foreground">Top mechanics</div>
            <div className="space-y-1 mt-2">
              {(data?.topMechanics ?? []).slice(0,3).map((m) => (
                <div key={m.id} className="flex items-center justify-between">
                  <div className="text-sm">{m.name}</div>
                  <div className="text-sm text-muted-foreground">{m.completedThisMonth} jobs</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-card">
          <div className="text-sm text-muted-foreground">Revenue (30d)</div>
          <div className="text-2xl font-bold">₹{loading ? '—' : data?.summary?.thisMonthRevenue ?? '—'}</div>
          <div className="text-sm text-muted-foreground">Today: ₹{loading ? '—' : data?.summary?.todayRevenue ?? '—'}</div>
          <div className="mt-3">
            <Sparkline points={(data?.revenueByDay ?? []).map(d => d.revenue)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="p-4 rounded-lg border bg-card lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Bookings by day (last 30d)</div>
            <div className="text-sm text-muted-foreground">Total: {data?.summary?.totalBookings ?? '—'}</div>
          </div>
          <div className="mt-3">
            <Sparkline points={(data?.bookingsByDay ?? []).map(d => d.total)} height={60} />
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-card">
          <div className="text-sm text-muted-foreground">Booking status breakdown</div>
          <div className="mt-3">
            <StatusBars map={data?.bookingsByStatus as Record<string, number> ?? {}} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border bg-card md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Recent bookings</div>
            <div className="text-sm text-muted-foreground">Showing last {data?.recentBookings?.length ?? 0}</div>
          </div>
          <div className="mt-3 space-y-2">
            {(data?.recentBookings ?? []).slice(0,5).map((b: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 border rounded">
                <div className="text-sm font-mono">{b.id ?? '—'}</div>
                <div className="text-sm">{b.customer ? `${b.customer.firstName} ${b.customer.lastName}` : '—'}</div>
                <div className="text-sm text-muted-foreground">{b.service?.name ?? '—'}</div>
                <div className="text-sm text-muted-foreground">{b.status}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-card">
          <div className="text-sm text-muted-foreground">Needs attention</div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div>Pending bookings</div>
              <div className="font-medium">{data?.summary?.pendingBookings ?? 0}</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div>Unassigned / Pending</div>
              <div className="font-medium">{data?.summary?.pendingBookings ?? 0}</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div>Unavailable mechanics</div>
              <div className="font-medium">{(data?.summary?.activeMechanics ?? 0) - (data?.summary?.availableMechanics ?? 0)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
