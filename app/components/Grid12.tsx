import { Grid, Box } from '@radix-ui/themes';
import { ReactNode } from 'react';
import { Container } from './Container';

interface Grid12Props {
  children: ReactNode;
  gap?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
  className?: string;
  withContainer?: boolean;
}

interface GridItemProps {
  children: ReactNode;
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  spanSm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  spanMd?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  spanLg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  className?: string;
}

/**
 * 12-Column Grid System
 * Pre-configured grid with responsive behavior
 * 
 * Breakpoints:
 * - initial (mobile): Single column
 * - md (tablet/desktop): 12 columns
 * 
 * Example:
 * <Grid12 gap="4">
 *   <Grid12.Item span={12} spanMd={6}>
 *     Content spans full width on mobile, half on desktop
 *   </Grid12.Item>
 *   <Grid12.Item span={12} spanMd={6}>
 *     Content spans full width on mobile, half on desktop
 *   </Grid12.Item>
 * </Grid12>
 */
export function Grid12({ children, gap = '4', className, withContainer = true }: Grid12Props) {
  const gridContent = (
    <Grid
      columns={{ initial: '1', md: '12' }}
      gap={gap}
      className={className}
      width="auto"
    >
      {children}
    </Grid>
  );

  if (withContainer) {
    return <Container>{gridContent}</Container>;
  }

  return gridContent;
}

/**
 * Grid Item Component
 * Supports responsive column spans
 * 
 * Example:
 * <Grid12.Item span={12} spanMd={4}>
 *   Content
 * </Grid12.Item>
 */
Grid12.Item = function GridItem({ children, span = 12, spanSm, spanMd, spanLg, className }: GridItemProps) {
  const gridColumn: Record<string, string> = {};
  
  // Default span (mobile)
  if (span) {
    gridColumn.initial = `span ${span}`;
  }
  
  // Responsive spans
  if (spanSm) {
    gridColumn.sm = `span ${spanSm}`;
  }
  
  if (spanMd) {
    gridColumn.md = `span ${spanMd}`;
  }
  
  if (spanLg) {
    gridColumn.lg = `span ${spanLg}`;
  }

  return (
    <Box
      className={className}
      style={{
        gridColumn: gridColumn.initial || 'span 12',
      }}
      // Apply responsive grid columns via inline styles for different breakpoints
      {...(Object.keys(gridColumn).length > 1 && {
        style: {
          '--grid-column-initial': gridColumn.initial || 'span 12',
          '--grid-column-sm': gridColumn.sm,
          '--grid-column-md': gridColumn.md,
          '--grid-column-lg': gridColumn.lg,
          gridColumn: 'var(--grid-column-initial)',
        } as React.CSSProperties,
      })}
    >
      {children}
    </Box>
  );
};

// Export Container for convenience
export { Container };



