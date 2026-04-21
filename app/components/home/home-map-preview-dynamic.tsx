'use client';

import dynamic from 'next/dynamic';

import type { Chiropractor } from '@/app/lib/queries';

const HomeMapPreviewLazy = dynamic(
  () => import('./home-map-preview.entry').then((m) => m.HomeMapPreview),
  { ssr: false, loading: () => null },
);

export function HomeMapPreviewDynamic({ chiropractors }: { chiropractors: Chiropractor[] }) {
  return <HomeMapPreviewLazy chiropractors={chiropractors} />;
}
