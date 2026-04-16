import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Wide layout for grid-style account pages (Specialties, future dashboards).
 * Provides generous horizontal space for multi-column card grids; mirrors the
 * preview shell pattern used in `/dev/dashboard-preview`.
 */
export function AccountGridPage({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex w-full flex-col gap-6', className)}>
      {(title || description || actions) && (
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            {title ? (
              <h2 className="text-2xl font-bold leading-8 tracking-[-0.01em] text-foreground">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-base leading-6 text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
        </header>
      )}
      {children}
    </div>
  );
}
