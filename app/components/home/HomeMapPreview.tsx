'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import type { Chiropractor } from '@/app/lib/queries';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
/** Continental US center: keeps the national network visible at first paint. */
const US_CENTER: [number, number] = [-98.5795, 39.8283];
const DEFAULT_ZOOM = 3.4;

interface HomeMapPreviewProps {
  chiropractors: Chiropractor[];
}

/**
 * Non-interactive browse map for the marketing homepage. Renders the same
 * clustered markers as the search experience, then overlays a "Find care"
 * CTA that swallows pointer input so the map cannot be panned or zoomed.
 */
export function HomeMapPreview({ chiropractors }: HomeMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [ready, setReady] = useState(false);

  const mappable = useMemo(
    () =>
      chiropractors.filter(
        (c) =>
          c.latitude != null &&
          c.longitude != null &&
          Number.isFinite(c.latitude) &&
          Number.isFinite(c.longitude),
      ),
    [chiropractors],
  );

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: US_CENTER,
      zoom: DEFAULT_ZOOM,
      interactive: false,
      attributionControl: false,
      cooperativeGestures: false,
      pitchWithRotate: false,
      dragRotate: false,
    });
    map.on('load', () => {
      mapRef.current = map;
      setReady(true);
    });
    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const sourceId = 'home-map-preview-source';
    const clusterLayerId = 'home-map-preview-clusters';
    const clusterCountLayerId = 'home-map-preview-cluster-count';
    const unclusteredLayerId = 'home-map-preview-unclustered';

    if (map.getSource(sourceId)) {
      if (map.getLayer(clusterCountLayerId)) map.removeLayer(clusterCountLayerId);
      if (map.getLayer(clusterLayerId)) map.removeLayer(clusterLayerId);
      if (map.getLayer(unclusteredLayerId)) map.removeLayer(unclusteredLayerId);
      map.removeSource(sourceId);
    }

    const geojson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: 'FeatureCollection',
      features: mappable.map((c) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [c.longitude as number, c.latitude as number],
        },
        properties: { id: c.id },
      })),
    };

    map.addSource(sourceId, {
      type: 'geojson',
      data: geojson,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    map.addLayer({
      id: clusterLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#0071e3',
        'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 30, 30],
        'circle-opacity': 0.85,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });

    map.addLayer({
      id: clusterCountLayerId,
      type: 'symbol',
      source: sourceId,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-size': 13,
      },
      paint: { 'text-color': '#ffffff' },
    });

    map.addLayer({
      id: unclusteredLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#30a84e',
        'circle-radius': 7,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });
  }, [ready, mappable]);

  useEffect(() => {
    if (!ready || !containerRef.current) return;
    const ro = new ResizeObserver(() => mapRef.current?.resize());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [ready]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border bg-muted shadow-2xl">
      <div
        ref={containerRef}
        className="h-[420px] w-full md:h-[560px] lg:h-[680px]"
        aria-hidden
      />

      {/* Click-blocker: covers the map and elevates the CTA. */}
      <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/10 via-black/5 to-black/30">
        <Button
          asChild
          size="lg"
          className="h-14 rounded-full px-8 text-base font-semibold shadow-2xl ring-1 ring-black/10"
        >
          <Link href="/search" aria-label="Browse chiropractors on the map">
            <Search className="mr-2 size-5" />
            Find care
          </Link>
        </Button>
      </div>

      {!MAPBOX_TOKEN && (
        <div className="text-muted-foreground absolute inset-0 flex items-center justify-center text-sm">
          Map preview requires NEXT_PUBLIC_MAPBOX_TOKEN.
        </div>
      )}
    </div>
  );
}
