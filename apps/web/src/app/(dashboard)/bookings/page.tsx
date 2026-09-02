import type { Metadata } from 'next';
import BookingsClient from '@/components/bookings/BookingsClient';

export const metadata: Metadata = { title: 'Bookings' };

export default function BookingsPage(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground mt-1">Manage and track all service bookings.</p>
      </div>

      <BookingsClient />
    </div>
  );
}
