import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps {
  children: ReactNode;
  size?: 'full' | 'default';
  className?: string;
}

/**
 * Container component with responsive padding and max-width
 * - Max width: 1440px
 * - Responsive padding: 16px (mobile) → 24px (tablet) → 32px (desktop)
 */
export function Container({ children, size = 'default', className }: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 sm:px-5 md:px-6',
        className,
      )}
      style={{
        maxWidth: size === 'default' ? '1440px' : '100%',
      }}
    >
      {children}
    </div>
  );
}
