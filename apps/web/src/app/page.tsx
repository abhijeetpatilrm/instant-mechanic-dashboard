import { redirect } from 'next/navigation';

/**
 * Root route — redirect to the dashboard.
 * Using redirect() (not next/link) to avoid a flash of the root URL.
 */
export default function RootPage(): never {
  redirect('/dashboard');
}
