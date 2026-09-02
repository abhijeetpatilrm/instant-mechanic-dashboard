import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Bookings' };

export default function BookingsPage(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground mt-1">
          Manage and track all service bookings.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-muted-foreground text-sm">
          Booking management table will be displayed here in Phase 2.
        </p>
      </div>
    </div>
  );
}
