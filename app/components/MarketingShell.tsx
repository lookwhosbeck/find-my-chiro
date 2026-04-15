import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type MarketingShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Marketing page frame: semantic background, full-height column.
 * Section padding stays in page-level modules or Tailwind on children.
 */
export function MarketingShell({ children, className }: MarketingShellProps) {
  return (
    <div
      className={cn(
        'from-muted to-primary/5 flex min-h-screen flex-col bg-gradient-to-tl text-foreground antialiased',
        className,
      )}
    >
      {children}
    </div>
  );
}
