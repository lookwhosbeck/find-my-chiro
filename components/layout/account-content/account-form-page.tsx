import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Narrow, centered layout for form-style account pages (Figma nodes 26:993, 26:1057).
 * Title + description stack above a single column card; caps reading width to ~672px
 * so long lines don't fatigue the eye when filling out forms.
 */
export function AccountFormPage({
  title,
  description,
  children,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-[1024px] flex-col items-start gap-6',
        className,
      )}
    >
      {(title || description) && (
        <header className="w-full max-w-[672px] space-y-0.5">
          {title ? (
            <h2 className="text-2xl font-bold leading-8 tracking-[-0.01em] text-foreground">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="text-base leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </header>
      )}
      <div className="w-full max-w-[672px]">{children}</div>
    </div>
  );
}
