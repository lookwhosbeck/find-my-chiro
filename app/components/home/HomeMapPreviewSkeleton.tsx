import { Skeleton } from '@/components/ui/skeleton';

/** Placeholder while `HomeMapPreviewLoader` streams in. */
export function HomeMapPreviewSkeleton() {
  return (
    <div
      className="relative w-full overflow-hidden rounded-[32px] border bg-muted"
      aria-hidden
    >
      <Skeleton className="h-[420px] w-full md:h-[560px] lg:h-[680px] rounded-[32px]" />
    </div>
  );
}
