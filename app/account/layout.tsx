import type { ReactNode } from 'react';

/** Account canvas — muted surface behind the dashboard shell (see `components/dashboard-shell.tsx`). */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-svh bg-muted/40 text-foreground">{children}</div>;
}
