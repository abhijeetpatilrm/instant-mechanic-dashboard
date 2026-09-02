import type { Metadata } from 'next';
import DashboardClient from '@/components/dashboard/DashboardClient';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Live Operations Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Real-time overview of bookings, mechanics, and revenue.
        </p>
      </div>

      <div className="rounded-lg p-4">
        <DashboardClient />
      </div>
    </div>
  );
}
