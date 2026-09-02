"use client";

import React from 'react';

export function SkeletonBox({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded ${className}`} />;
}

export function SkeletonTableRows({ rows = 4, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-2 items-center">
          {Array.from({ length: cols }).map((__, j) => (
            <div key={j} className="flex-1 h-4 bg-muted rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default SkeletonBox;
import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
