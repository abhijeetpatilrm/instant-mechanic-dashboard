import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

/**
 * Dashboard overview page.
 * Data fetching + metric cards will be implemented in Phase 2.
 * Uses server component pattern — data is fetched on the server.
 */
export default function DashboardPage(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Live Operations Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Real-time overview of bookings, mechanics, and revenue.
        </p>
      </div>

      {/* Phase 2: MetricsGrid, BookingsFeed, MechanicMap will render here */}
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-muted-foreground text-sm">
          Dashboard metrics will be displayed here in Phase 2.
        </p>
      </div>
    </div>
  );
}
