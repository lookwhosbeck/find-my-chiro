import type { ReactNode } from 'react';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Standard field layout: label on top (14px medium), control, optional description below (14px muted).
 * Pair with `<Input />`, `<Textarea />`, or `<NativeSelect />` from the design system so every form
 * field on every account page looks identical.
 */
export function AccountFormField({
  id,
  label,
  description,
  descriptionPosition = 'below',
  children,
  className,
}: {
  id?: string;
  label?: ReactNode;
  description?: ReactNode;
  descriptionPosition?: 'below' | 'above';
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex w-full flex-col gap-2', className)}>
      {label ? (
        <Label htmlFor={id} className="text-sm font-medium leading-none text-foreground">
          {label}
        </Label>
      ) : null}
      {description && descriptionPosition === 'above' ? (
        <p className="text-sm leading-5 text-muted-foreground">{description}</p>
      ) : null}
      {children}
      {description && descriptionPosition === 'below' ? (
        <p className="text-sm leading-5 text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
