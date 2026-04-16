import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-svh bg-muted/40 text-foreground">{children}</div>;
}
