import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';

/**
 * Dev-only preview of the logged-in dashboard layout. Returns 404 in production.
 */
export default function DashboardPreviewLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  return children;
}
