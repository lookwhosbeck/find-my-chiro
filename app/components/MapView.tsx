'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Box, Flex, Text, Heading } from '@radix-ui/themes';
import Link from 'next/link';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Chiropractor } from '../lib/queries';
import { matchScorePillColors } from '../lib/match-score-pill-colors';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const US_CENTER: [number, number] = [-98.5795, 39.8283];
const DEFAULT_ZOOM = 4;

function markerColor(score: number | undefined): string {
  if (score == null) return '#86868b';
  if (score >= 90) return '#30a84e';
  if (score >= 80) return '#6cc070';
  return '#86868b';
}

interface MapChiropractor extends Chiropractor {
  latitude: number;
  longitude: number;
}

function hasCoords(c: Chiropractor): c is MapChiropractor {
  return c.latitude != null && c.longitude != null && Number.isFinite(c.latitude) && Number.isFinite(c.longitude);
}

interface MapViewProps {
  chiropractors: Chiropractor[];
  profileHrefBuilder: (chiro: Chiropractor) => string;
}

export function MapView({ chiropractors, profileHrefBuilder }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const listRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [activeId, setActiveId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const mappable = chiropractors.filter(hasCoords);

  const fitBounds = useCallback((map: mapboxgl.Map, items: MapChiropractor[]) => {
    if (items.length === 0) return;
    if (items.length === 1) {
      map.flyTo({ center: [items[0].longitude, items[0].latitude], zoom: 12 });
      return;
    }
    const bounds = new mapboxgl.LngLatBounds();
    items.forEach((c) => bounds.extend([c.longitude, c.latitude]));
    map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: US_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('load', () => {
      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();
    popupRef.current?.remove();

    if (mappable.length > 20) {
      addClusteredMarkers(map, mappable);
    } else {
      addSimpleMarkers(map, mappable);
    }

    fitBounds(map, mappable);
  }, [mapReady, chiropractors, mappable.length, fitBounds]);

  const addSimpleMarkers = useCallback((map: mapboxgl.Map, items: MapChiropractor[]) => {
    items.forEach((chiro) => {
      const el = document.createElement('div');
      el.className = 'mapview-marker';
      el.style.backgroundColor = markerColor(chiro.matchScore);
      el.dataset.chiroId = chiro.id;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([chiro.longitude, chiro.latitude])
        .addTo(map);

      el.addEventListener('click', () => handleMarkerClick(chiro, map));

      markersRef.current.set(chiro.id, marker);
    });
  }, []);

  const addClusteredMarkers = useCallback((map: mapboxgl.Map, items: MapChiropractor[]) => {
    const sourceId = 'chiro-cluster-source';
    const clusterId = 'chiro-clusters';
    const clusterCountId = 'chiro-cluster-count';
    const unclusteredId = 'chiro-unclustered';

    if (map.getSource(sourceId)) {
      map.removeLayer(clusterCountId);
      map.removeLayer(clusterId);
      map.removeLayer(unclusteredId);
      map.removeSource(sourceId);
    }

    const geojson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: 'FeatureCollection',
      features: items.map((c) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [c.longitude, c.latitude] },
        properties: {
          id: c.id,
          name: `Dr. ${c.firstName} ${c.lastName}`.trim(),
          matchScore: c.matchScore ?? 0,
          specialty: buildSpecialtyLine(c),
        },
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
      id: clusterId,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#0071e3',
        'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 30, 30],
        'circle-opacity': 0.85,
      },
    });

    map.addLayer({
      id: clusterCountId,
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
      id: unclusteredId,
      type: 'circle',
      source: sourceId,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'case',
          ['>=', ['get', 'matchScore'], 90], '#30a84e',
          ['>=', ['get', 'matchScore'], 80], '#6cc070',
          '#86868b',
        ],
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });

    map.on('click', clusterId, (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [clusterId] });
      if (!features.length) return;
      const clustIdVal = features[0].properties?.cluster_id;
      (map.getSource(sourceId) as mapboxgl.GeoJSONSource).getClusterExpansionZoom(clustIdVal, (err, zoom) => {
        if (err || zoom == null) return;
        const geom = features[0].geometry;
        if (geom.type !== 'Point') return;
        map.easeTo({ center: geom.coordinates as [number, number], zoom });
      });
    });

    map.on('click', unclusteredId, (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [unclusteredId] });
      if (!features.length) return;
      const props = features[0].properties;
      if (!props) return;
      const chiro = items.find((c) => c.id === props.id);
      if (chiro) handleMarkerClick(chiro, map);
    });

    map.on('mouseenter', clusterId, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', clusterId, () => { map.getCanvas().style.cursor = ''; });
    map.on('mouseenter', unclusteredId, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', unclusteredId, () => { map.getCanvas().style.cursor = ''; });
  }, []);

  const handleMarkerClick = useCallback((chiro: MapChiropractor, map: mapboxgl.Map) => {
    setActiveId(chiro.id);

    popupRef.current?.remove();

    const score = chiro.matchScore ?? 0;
    const pillColors = matchScorePillColors(score);
    const popup = new mapboxgl.Popup({ offset: 25, closeButton: true, maxWidth: '260px' })
      .setLngLat([chiro.longitude, chiro.latitude])
      .setHTML(`
        <div class="mapview-popup">
          <strong>Dr. ${chiro.firstName} ${chiro.lastName}</strong>
          <span class="mapview-popup-match" style="background:${pillColors.backgroundColor};color:${pillColors.color}">
            ${Math.round(score)}% Match
          </span>
          <span class="mapview-popup-specialty">${buildSpecialtyLine(chiro)}</span>
        </div>
      `)
      .addTo(map);

    popupRef.current = popup;
    popup.on('close', () => {
      if (popupRef.current === popup) popupRef.current = null;
    });

    map.flyTo({ center: [chiro.longitude, chiro.latitude], zoom: Math.max(map.getZoom(), 12) });

    const listEl = listRefs.current.get(chiro.id);
    listEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  const handleListItemClick = useCallback((chiro: Chiropractor) => {
    if (!hasCoords(chiro) || !mapRef.current) return;
    setActiveId(chiro.id);

    const map = mapRef.current;
    map.flyTo({ center: [chiro.longitude, chiro.latitude], zoom: Math.max(map.getZoom(), 12) });

    popupRef.current?.remove();

    const score = chiro.matchScore ?? 0;
    const pillColors = matchScorePillColors(score);
    const popup = new mapboxgl.Popup({ offset: 25, closeButton: true, maxWidth: '260px' })
      .setLngLat([chiro.longitude, chiro.latitude])
      .setHTML(`
        <div class="mapview-popup">
          <strong>Dr. ${chiro.firstName} ${chiro.lastName}</strong>
          <span class="mapview-popup-match" style="background:${pillColors.backgroundColor};color:${pillColors.color}">
            ${Math.round(score)}% Match
          </span>
          <span class="mapview-popup-specialty">${buildSpecialtyLine(chiro)}</span>
        </div>
      `)
      .addTo(map);

    popupRef.current = popup;

    const markerEl = markersRef.current.get(chiro.id)?.getElement();
    if (markerEl) {
      markerEl.classList.add('mapview-marker--active');
      setTimeout(() => markerEl.classList.remove('mapview-marker--active'), 1500);
    }
  }, []);

  const handleListItemHover = useCallback((chiro: Chiropractor) => {
    if (!hasCoords(chiro) || !mapRef.current) return;
    const markerEl = markersRef.current.get(chiro.id)?.getElement();
    if (markerEl) markerEl.classList.add('mapview-marker--hover');
  }, []);

  const handleListItemLeave = useCallback((chiro: Chiropractor) => {
    const markerEl = markersRef.current.get(chiro.id)?.getElement();
    if (markerEl) markerEl.classList.remove('mapview-marker--hover');
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <Flex align="center" justify="center" py="9">
        <Text color="gray" size="3">
          Map view requires a Mapbox API token. Add NEXT_PUBLIC_MAPBOX_TOKEN to your environment.
        </Text>
      </Flex>
    );
  }

  return (
    <div className="mapview-container">
      <div className="mapview-list">
        {chiropractors.map((chiro) => (
          <div
            key={chiro.id}
            ref={(el) => { if (el) listRefs.current.set(chiro.id, el); }}
            className={`mapview-list-card${activeId === chiro.id ? ' mapview-list-card--active' : ''}`}
            onClick={() => handleListItemClick(chiro)}
            onMouseEnter={() => handleListItemHover(chiro)}
            onMouseLeave={() => handleListItemLeave(chiro)}
          >
            <MapListCard chiro={chiro} profileHref={profileHrefBuilder(chiro)} />
          </div>
        ))}
      </div>
      <div className="mapview-map-wrap">
        <div ref={mapContainerRef} className="mapview-map" />
      </div>
    </div>
  );
}

function LocationPinIcon() {
  return (
    <svg width={10} height={13} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function MapListCard({ chiro, profileHref }: { chiro: Chiropractor; profileHref: string }) {
  const displayName = `Dr. ${chiro.firstName} ${chiro.lastName}`.trim();
  const specialtyLine = buildSpecialtyLine(chiro);
  const locationLine = [chiro.city, chiro.state].filter(Boolean).join(', ');
  const distanceSuffix =
    chiro.distanceMiles != null && Number.isFinite(chiro.distanceMiles)
      ? `${chiro.distanceMiles.toFixed(1)} mi`
      : '';
  const matchPercent = chiro.matchScore != null && chiro.matchScore > 0 ? Math.round(chiro.matchScore) : null;
  const pillColors = matchPercent != null ? matchScorePillColors(matchPercent) : null;

  const initials = `${chiro.firstName?.[0] || ''}${chiro.lastName?.[0] || ''}`.toUpperCase();

  return (
    <Link href={profileHref} prefetch={false} className="mapview-list-card-link" onClick={(e) => e.stopPropagation()}>
      <Flex gap="3" align="start" style={{ width: '100%' }}>
        <Box
          style={{
            width: 56,
            height: 56,
            borderRadius: 10,
            overflow: 'hidden',
            flexShrink: 0,
            backgroundColor: 'var(--color-yellow-accent)',
          }}
        >
          {chiro.avatarUrl ? (
            <img
              src={chiro.avatarUrl}
              alt={displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <Flex align="center" justify="center" style={{ width: '100%', height: '100%' }}>
              <Text weight="medium" style={{ color: 'var(--color-chiro-card-text)', fontFamily: 'var(--font-body)', fontSize: 18, lineHeight: 1 }}>
                {initials}
              </Text>
            </Flex>
          )}
        </Box>

        <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
          <Flex align="center" justify="between" gap="2">
            <Text as="p" style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: 'var(--color-chiro-card-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </Text>
            {matchPercent != null && pillColors && (
              <Box style={{ ...pillColors, borderRadius: 5, padding: '2px 6px', flexShrink: 0 }}>
                <Text style={{ color: pillColors.color, fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 400, letterSpacing: '-0.36px', lineHeight: '18px', whiteSpace: 'nowrap' }}>
                  {matchPercent}% Match
                </Text>
              </Box>
            )}
          </Flex>
          {specialtyLine && (
            <Text as="p" style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 400, color: 'var(--color-chiro-card-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {specialtyLine}
            </Text>
          )}
          {(locationLine || distanceSuffix) && (
            <Flex align="center" gap="1" style={{ marginTop: 2 }}>
              <LocationPinIcon />
              <Text as="p" style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 400, color: 'var(--color-text-secondary)', margin: 0, whiteSpace: 'nowrap' }}>
                {locationLine}{locationLine && distanceSuffix ? ' · ' : ''}{distanceSuffix}
              </Text>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Link>
  );
}

function buildSpecialtyLine(chiro: Chiropractor): string {
  const parts: string[] = [];
  if (chiro.modality) {
    parts.push(chiro.modality);
  } else if (chiro.modalities?.length) {
    parts.push(chiro.modalities.slice(0, 2).join(', '));
  }
  if (chiro.philosophy) parts.push(chiro.philosophy);
  return parts.length > 0 ? parts.join(', ') : chiro.clinicName || '';
}
