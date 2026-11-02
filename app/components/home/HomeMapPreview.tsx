'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Chiropractor } from '@/app/lib/queries';
import styles from './home-marketing.module.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

/** Wide Atlantic globe. The load animation rotates and zooms from here, matching the old scroll move. */
const START_CENTER: [number, number] = [-30, 25];
const START_ZOOM = 0.6;
const START_BEARING = -25;

/** Fallback when no signed-up chiropractors have coordinates yet. */
const FALLBACK_CENTER: [number, number] = [-97.5, 38.2];
const FALLBACK_ZOOM = 3.4;
const HERO_BEARING = 0;
/** Keep the settled view closer than city scale; 6+ felt too tight for the hero. */
const HERO_MAX_ZOOM = 4.75;
const HERO_MIN_ZOOM = 3.0;

/** How long the load intro takes to settle. The old version played this over about a viewport of scroll. */
const INTRO_MS = 2600;

function easeOutCubic(t: number) {
  const clamped = Math.max(0, Math.min(1, t));
  return 1 - (1 - clamped) ** 3;
}

type HeroCamera = { center: [number, number]; zoom: number };

/** Frame the settled camera around where platform chiropractors actually are. */
function heroCameraForPoints(
  map: mapboxgl.Map,
  points: Array<{ latitude: number; longitude: number }>,
): HeroCamera {
  if (points.length === 0) {
    return { center: FALLBACK_CENTER, zoom: FALLBACK_ZOOM };
  }
  if (points.length === 1) {
    return {
      center: [points[0].longitude, points[0].latitude],
      zoom: Math.min(4.2, HERO_MAX_ZOOM),
    };
  }

  const bounds = new mapboxgl.LngLatBounds();
  for (const point of points) {
    bounds.extend([point.longitude, point.latitude]);
  }

  const camera = map.cameraForBounds(bounds, {
    padding: { top: 140, bottom: 96, left: 72, right: 72 },
    maxZoom: HERO_MAX_ZOOM,
    bearing: HERO_BEARING,
  });
  if (!camera?.center || camera.zoom == null) {
    return { center: FALLBACK_CENTER, zoom: FALLBACK_ZOOM };
  }

  const lngLat =
    typeof camera.center === 'object' && 'lng' in camera.center
      ? camera.center
      : mapboxgl.LngLat.convert(camera.center);

  return {
    center: [lngLat.lng, lngLat.lat],
    zoom: Math.max(HERO_MIN_ZOOM, Math.min(camera.zoom, HERO_MAX_ZOOM)),
  };
}

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

  /* Light-v11 keeps parks gray and roads hairline; nudge them so the hero reads as land + highways. */
  try {
    if (map.getLayer('national-park')) {
      map.setPaintProperty('national-park', 'fill-color', '#a8cfa8');
      map.setPaintProperty('national-park', 'fill-opacity', 0.78);
    }
    if (map.getLayer('landuse')) {
      map.setPaintProperty('landuse', 'fill-color', [
        'match',
        ['get', 'class'],
        ['park', 'pitch', 'grass', 'cemetery', 'wood', 'scrub'],
        '#b7d8b5',
        ['residential', 'airport'],
        'hsl(220, 8%, 94%)',
        'hsl(220, 5%, 92%)',
      ]);
      map.setPaintProperty('landuse', 'fill-opacity', 0.6);
    }
    if (map.getLayer('road-simple')) {
      map.setPaintProperty('road-simple', 'line-color', [
        'match',
        ['get', 'class'],
        ['motorway', 'trunk'],
        '#9aa3b2',
        ['primary'],
        '#b4bbc7',
        'hsl(220, 1%, 100%)',
      ]);
      map.setPaintProperty('road-simple', 'line-width', [
        'interpolate',
        ['exponential', 1.5],
        ['zoom'],
        5,
        ['match', ['get', 'class'], ['motorway', 'trunk'], 1.6, ['primary'], 0.9, 0],
        8,
        ['match', ['get', 'class'], ['motorway', 'trunk'], 3, ['primary'], 1.7, 0],
        12,
        ['match', ['get', 'class'], ['motorway', 'trunk'], 5, ['primary'], 2.6, 0],
      ]);
    }
  } catch {
    /* Style variants may omit these layer ids. */
  }
}

/**
 * Non-interactive globe behind the homepage hero. On load it rotates and zooms
 * from a wide Atlantic view into the cluster of signed-up chiropractors, then stays put.
 */
export function HomeMapPreview({ chiropractors }: HomeMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mappableRef = useRef<Array<{ latitude: number; longitude: number }>>([]);
  const [ready, setReady] = useState(false);

  const mappable = useMemo(
    () =>
      chiropractors.filter(
        (c): c is Chiropractor & { latitude: number; longitude: number } =>
          c.latitude != null &&
          c.longitude != null &&
          Number.isFinite(c.latitude) &&
          Number.isFinite(c.longitude),
      ),
    [chiropractors],
  );
  mappableRef.current = mappable;

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      projection: 'globe',
      center: reduceMotion ? FALLBACK_CENTER : START_CENTER,
      zoom: reduceMotion ? FALLBACK_ZOOM : START_ZOOM,
      bearing: reduceMotion ? HERO_BEARING : START_BEARING,
      pitch: 0,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
    });
    /* Drop the continent slightly so the headline stays in the fade, and the US sits under the search. */
    map.setPadding({ top: 72, bottom: 0, left: 0, right: 0 });
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
      const target = heroCameraForPoints(map, mappableRef.current);
      if (reduceMotion) {
        map.jumpTo({
          center: target.center,
          zoom: target.zoom,
          bearing: HERO_BEARING,
        });
        return;
      }
      map.easeTo({
        center: target.center,
        zoom: target.zoom,
        bearing: HERO_BEARING,
        duration: INTRO_MS,
        easing: easeOutCubic,
        essential: true,
      });
    });
    return () => {
      map.stop();
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
