import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
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

const gapClass: Record<string, string> = {
  '1': 'gap-1',
  '2': 'gap-2',
  '3': 'gap-3',
  '4': 'gap-4',
  '5': 'gap-5',
  '6': 'gap-6',
  '7': 'gap-7',
  '8': 'gap-8',
  '9': 'gap-9',
};

const mdSpan: Record<number, string> = {
  1: 'md:col-span-1',
  2: 'md:col-span-2',
  3: 'md:col-span-3',
  4: 'md:col-span-4',
  5: 'md:col-span-5',
  6: 'md:col-span-6',
  7: 'md:col-span-7',
  8: 'md:col-span-8',
  9: 'md:col-span-9',
  10: 'md:col-span-10',
  11: 'md:col-span-11',
  12: 'md:col-span-12',
};

const smSpan: Record<number, string> = {
  1: 'sm:col-span-1',
  2: 'sm:col-span-2',
  3: 'sm:col-span-3',
  4: 'sm:col-span-4',
  5: 'sm:col-span-5',
  6: 'sm:col-span-6',
  7: 'sm:col-span-7',
  8: 'sm:col-span-8',
  9: 'sm:col-span-9',
  10: 'sm:col-span-10',
  11: 'sm:col-span-11',
  12: 'sm:col-span-12',
};

const lgSpan: Record<number, string> = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
  7: 'lg:col-span-7',
  8: 'lg:col-span-8',
  9: 'lg:col-span-9',
  10: 'lg:col-span-10',
  11: 'lg:col-span-11',
  12: 'lg:col-span-12',
};

/** 12-column grid: 1 column on small screens, 12 on md+. */
export function Grid12({ children, gap = '4', className, withContainer = true }: Grid12Props) {
  const gridContent = (
    <div
      className={cn(
        'grid w-auto auto-rows-auto grid-cols-1 md:grid-cols-12',
        gapClass[gap] ?? 'gap-4',
        className,
      )}
    >
      {children}
    </div>
  );

  if (withContainer) {
    return <Container>{gridContent}</Container>;
  }

  return gridContent;
}

Grid12.Item = function GridItem({
  children,
  span: _span = 12,
  spanSm,
  spanMd,
  spanLg,
  className,
}: GridItemProps) {
  const md = spanMd ?? _span;
  return (
    <div
      className={cn(
        'min-w-0 col-span-full',
        spanSm ? smSpan[spanSm] : undefined,
        mdSpan[md] ?? 'md:col-span-12',
        spanLg ? lgSpan[spanLg] : undefined,
        className,
      )}
    >
      {children}
    </div>
  );
};

export { Container };
