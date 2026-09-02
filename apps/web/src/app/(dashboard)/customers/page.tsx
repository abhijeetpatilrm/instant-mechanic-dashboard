import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Customers' };

export default function CustomersPage(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground mt-1">
          Customer profiles, vehicles, and booking history.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-muted-foreground text-sm">
          Customer management will be displayed here in Phase 2.
        </p>
      </div>
    </div>
  );
}
