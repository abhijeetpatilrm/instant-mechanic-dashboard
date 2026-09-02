"use client";

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically load the client LiveDashboard with SSR disabled.
const LiveDashboard = dynamic(() => import('@/components/dashboard/LiveDashboard'), { ssr: false });

export default function DashboardClient(): JSX.Element {
  return <LiveDashboard />;
}
