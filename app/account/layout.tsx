import type { ReactNode } from 'react';

/**
 * Account canvas — muted surface behind the existing in-page sidebar shell.
 * Pro Kit dashboard primitives live under `components/dashboard-page-layout1/`.
 */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-svh bg-muted/40 text-foreground">{children}</div>;
}
