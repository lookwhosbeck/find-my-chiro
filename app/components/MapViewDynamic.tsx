'use client';

import dynamic from 'next/dynamic';

import type { MapViewProps } from '@/app/components/MapView';

const MapViewLazy = dynamic(() => import('./MapView.entry').then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="mapview-root flex min-h-[50vh] items-center justify-center bg-muted/30">
      <p className="text-muted-foreground text-sm">Loading map…</p>
    </div>
  ),
});

export function MapViewDynamic(props: MapViewProps) {
  return <MapViewLazy {...props} />;
}
