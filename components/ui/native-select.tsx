import * as React from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Native `<select>` styled to match the shadcn `Input` primitive (36px / 6px radius / border-input / subtle shadow).
 * Use for simple single-select dropdowns (state, budget, insurance) so inputs across the app share identical chrome.
 */
const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative w-full">
    <select
      ref={ref}
      className={cn(
        'flex h-9 w-full appearance-none items-center rounded-md border border-input bg-transparent px-3 py-1 pr-9 text-base shadow-sm outline-none transition-[color,box-shadow]',
        'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      aria-hidden
      className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
    />
  </div>
));
NativeSelect.displayName = 'NativeSelect';

export { NativeSelect };
