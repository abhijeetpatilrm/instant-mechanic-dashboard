import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Mechanics' };

export default function MechanicsPage(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mechanics</h1>
        <p className="text-muted-foreground mt-1">
          View mechanic availability, assignments, and performance.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-muted-foreground text-sm">
          Mechanic roster and live map will be displayed here in Phase 2.
        </p>
      </div>
    </div>
  );
}
