'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import { Button } from '@/components/ui/button';
import type { Chiropractor } from '@/app/lib/queries';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

/** Globe start (wide view on the Atlantic) rotates over to the continental US as the user scrolls. */
const START_CENTER: [number, number] = [-30, 25];
const END_CENTER: [number, number] = [-98.5795, 39.8283];
const START_ZOOM = 0.6;
const END_ZOOM = 3.6;
const START_BEARING = -25;
const END_BEARING = 0;

interface HomeMapPreviewProps {
  chiropractors: Chiropractor[];
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Ease-out cubic → progress feels organic and settles at the US view. */
function easeOutCubic(t: number) {
  const clamped = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - clamped, 3);
}

/**
 * Non-interactive browse map for the marketing homepage. Starts as a globe,
 * then rotates and zooms toward the US as the section scrolls through the
 * viewport. A click-blocking overlay with a "Find care" CTA sits on top.
 */
export function HomeMapPreview({ chiropractors }: HomeMapPreviewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const rafRef = useRef<number | null>(null);
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
      projection: 'globe',
      center: START_CENTER,
      zoom: START_ZOOM,
      bearing: START_BEARING,
      interactive: false,
      attributionControl: false,
      cooperativeGestures: false,
      pitchWithRotate: false,
      dragRotate: false,
    });
    map.on('style.load', () => {
      map.setFog({
        color: 'rgb(220, 230, 240)',
        'high-color': 'rgb(160, 190, 230)',
        'horizon-blend': 0.03,
        'space-color': 'rgb(8, 14, 30)',
        'star-intensity': 0.25,
      });
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

  /** Drive the camera from scroll position: globe → continental US as the section scrolls through the viewport. */
  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    const wrapper = wrapperRef.current;
    if (!map || !wrapper) return;

    const computeProgress = () => {
      const rect = wrapper.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 when the top of the map sits at the bottom of the viewport (just entering),
      // 1 when the top of the map has reached the top of the viewport (fully in view).
      const raw = 1 - rect.top / vh;
      return easeOutCubic(raw);
    };

    const applyProgress = () => {
      const t = computeProgress();
      const lng = lerp(START_CENTER[0], END_CENTER[0], t);
      const lat = lerp(START_CENTER[1], END_CENTER[1], t);
      const zoom = lerp(START_ZOOM, END_ZOOM, t);
      const bearing = lerp(START_BEARING, END_BEARING, t);
      map.jumpTo({ center: [lng, lat], zoom, bearing });
      rafRef.current = null;
    };

    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(applyProgress);
    };

    applyProgress();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [ready]);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full overflow-hidden rounded-[32px] border bg-muted"
    >
      <div
        ref={containerRef}
        className="h-[420px] w-full md:h-[560px] lg:h-[680px]"
        aria-hidden
      />

      {/* Click-blocker: swallows pointer input so the map can't be interacted with, and elevates the CTA. */}
      <div className="pointer-events-auto absolute inset-0 flex items-center justify-center">
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
