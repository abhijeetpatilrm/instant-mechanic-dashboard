import type { Metadata } from 'next';
import MechanicsClient from '@/components/mechanics/MechanicsClient';

export const metadata: Metadata = { title: 'Mechanics' };

export default function MechanicsPage(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mechanics</h1>
        <p className="text-muted-foreground mt-1">View mechanic availability, assignments, and performance.</p>
      </div>

      <MechanicsClient />
    </div>
  );
}
