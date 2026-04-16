import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Bordered white card matching Figma 26:1066 / 26:1002 (12px radius, 1px Mischka border, 25px padding).
 * Use `spacing="sm"` for denser list-style cards (like the Getting Started checklist).
 */
export function AccountFormCard({
  children,
  className,
  spacing = 'lg',
}: {
  children: ReactNode;
  className?: string;
  spacing?: 'sm' | 'lg';
}) {
  return (
    <div
      className={cn(
        'w-full rounded-xl border border-[#e4e4e8] bg-card text-card-foreground shadow-sm',
        'p-[25px]',
        className,
      )}
    >
      <div
        className={cn(
          'flex flex-col',
          spacing === 'lg' ? 'gap-8' : 'gap-4',
        )}
      >
        {children}
      </div>
    </div>
  );
}
