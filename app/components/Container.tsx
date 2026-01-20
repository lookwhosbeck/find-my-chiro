import { Box } from '@radix-ui/themes';
import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  size?: 'full' | 'default';
  className?: string;
}

/**
 * Container component with responsive padding and max-width
 * - Max width: 1440px
 * - Responsive padding: 16px (mobile) → 24px (tablet) → 32px (desktop)
 * - Uses Radix CSS variables for spacing consistency
 */
export function Container({ children, size = 'default', className }: ContainerProps) {
  return (
    <Box
      className={className}
      px={{ initial: '4', sm: '5', md: '6' }}
      style={{
        maxWidth: size === 'default' ? '1440px' : '100%',
        marginLeft: 'auto',
        marginRight: 'auto',
        width: '100%',
      }}
    >
      {children}
    </Box>
  );
}



