'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Chiropractor } from '@/app/lib/queries';
import styles from './home-marketing.module.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

/** Settled hero framing: continental US on a light globe, sitting behind the headline. */
const HERO_CENTER: [number, number] = [-97.5, 38.2];
const HERO_ZOOM = 3.05;

interface HomeMapPreviewProps {
  chiropractors: Chiropractor[];
}

function styleHeroBasemap(map: mapboxgl.Map) {
  const layers = map.getStyle()?.layers ?? [];
  for (const layer of layers) {
    if (layer.type === 'symbol') {
      map.setLayoutProperty(layer.id, 'visibility', 'none');
      continue;
    }
    const id = layer.id.toLowerCase();
    if (!id.includes('water')) continue;
    try {
      if (layer.type === 'fill') map.setPaintProperty(layer.id, 'fill-color', '#8ec4ee');
      if (layer.type === 'line') map.setPaintProperty(layer.id, 'line-color', '#7eb6e4');
    } catch {
      /* Some water layers don't expose a flat color. */
    }
  }
  if (map.getLayer('background')) {
    map.setPaintProperty('background', 'background-color', '#e7f3fb');
  }
}

/**
 * Non-interactive globe behind the homepage hero. Opens on North America so the
 * headline and search sit on the map, instead of a separate card below the copy.
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
      style: 'mapbox://styles/mapbox/light-v11',
      projection: 'globe',
      center: HERO_CENTER,
      zoom: HERO_ZOOM,
      bearing: 0,
      pitch: 0,
      /* Drop the continent slightly so the headline stays in the fade, and the US sits under the search. */
      padding: { top: 72, bottom: 0, left: 0, right: 0 },
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
    });
    map.on('style.load', () => {
      styleHeroBasemap(map);
      map.setFog({
        color: 'rgb(210, 230, 245)',
        'high-color': 'rgb(126, 176, 216)',
        'horizon-blend': 0.16,
        'space-color': 'rgb(244, 248, 252)',
        'star-intensity': 0,
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
    const unclusteredLayerId = 'home-map-preview-unclustered';

    if (map.getSource(sourceId)) {
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
      clusterRadius: 28,
    });

    map.addLayer({
      id: clusterLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#2563eb',
        'circle-radius': ['step', ['get', 'point_count'], 12, 8, 16, 24, 20],
        'circle-opacity': 0.92,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#ffffff',
      },
    });

    map.addLayer({
      id: unclusteredLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#2563eb',
        'circle-radius': 5,
        'circle-stroke-width': 1.5,
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
    <div className={styles.mapWrap}>
      <div ref={containerRef} className={styles.mapCanvas} aria-hidden />
      {!MAPBOX_TOKEN && (
        <p className={styles.mapFallback}>Map preview requires NEXT_PUBLIC_MAPBOX_TOKEN.</p>
      )}
    </div>
  );
}
