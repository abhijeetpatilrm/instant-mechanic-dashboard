import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Instant Mechanic — Live Operations Dashboard',
    template: '%s | Instant Mechanic',
  },
  description:
    'Real-time operations dashboard for managing mechanic dispatch, bookings, and customer service.',
  robots: { index: false, follow: false }, // Internal tool — no indexing
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  );
}
