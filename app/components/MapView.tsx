'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Flex, Text, Heading } from '@radix-ui/themes';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Chiropractor } from '../lib/queries';
import { matchScorePillColors } from '../lib/match-score-pill-colors';
import { ChiropractorCard } from './ChiropractorCard';
import { MapFloatingControls } from './MapFloatingControls';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const US_CENTER: [number, number] = [-98.5795, 39.8283];
const DEFAULT_ZOOM = 4;
const MOBILE_MAP_MAX = '(max-width: 768px)';

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
  resultsMatchAverage: number | null;
  /** Figma 90:2518 — scroll to / open map filters (mobile) */
  onFilterMapClick?: () => void;
}

export function MapView({ chiropractors, profileHrefBuilder, resultsMatchAverage, onFilterMapClick }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const listRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const listScrollRef = useRef<HTMLDivElement>(null);
  const programmaticScrollRef = useRef(false);
  const activeIdRef = useRef<string | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapControlsVertical, setMapControlsVertical] = useState(false);

  const mappable = chiropractors.filter(hasCoords);

  activeIdRef.current = activeId;

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
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 380px)');
    const sync = () => setMapControlsVertical(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const scrollListToChiro = useCallback((id: string) => {
    const wrap = listRefs.current.get(id);
    if (!wrap) return;
    programmaticScrollRef.current = true;
    const isMobile = typeof window !== 'undefined' && window.matchMedia(MOBILE_MAP_MAX).matches;
    wrap.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: isMobile ? 'center' : 'nearest',
    });
    window.setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 500);
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

    scrollListToChiro(chiro.id);
  }, [scrollListToChiro]);

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
  }, [handleMarkerClick]);

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
  }, [handleMarkerClick]);

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
  }, [mapReady, chiropractors, mappable.length, fitBounds, addSimpleMarkers, addClusteredMarkers]);

  /** Mobile horizontal snap: sync map center + highlight when the centered card changes */
  useEffect(() => {
    let cancelled = false;
    let observer: IntersectionObserver | undefined;

    const connect = () => {
      const root = listScrollRef.current;
      const map = mapRef.current;
      if (!root || !map || !mapReady || cancelled) return;

      const mq = window.matchMedia(MOBILE_MAP_MAX);
      if (!mq.matches) return;

      observer = new IntersectionObserver(
        (entries) => {
          if (programmaticScrollRef.current) return;
          const best = [...entries]
            .filter((e) => e.isIntersecting && e.intersectionRatio >= 0.5)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (!best?.target) return;
          const id = best.target.getAttribute('data-chiro-id');
          if (!id || id === activeIdRef.current) return;

          setActiveId(id);
          const chiro = chiropractors.find((c) => c.id === id);
          if (chiro && hasCoords(chiro)) {
            popupRef.current?.remove();
            map.flyTo({
              center: [chiro.longitude, chiro.latitude],
              zoom: Math.max(map.getZoom(), 12),
            });
          }
        },
        { root, threshold: [0.45, 0.55, 0.65, 0.75, 0.85, 0.95, 1] },
      );

      listRefs.current.forEach((el) => observer?.observe(el));
    };

    let rafInner = 0;
    const rafOuter = requestAnimationFrame(() => {
      rafInner = requestAnimationFrame(connect);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafOuter);
      cancelAnimationFrame(rafInner);
      observer?.disconnect();
    };
  }, [mapReady, chiropractors]);

  /** DOM markers: persistent selected state */
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement();
      if (activeId === id) el.classList.add('mapview-marker--selected');
      else el.classList.remove('mapview-marker--selected');
    });
  }, [activeId, mapReady, chiropractors]);

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
    <div className="mapview-split">
      <div className="mapview-list">
        <Heading
          size="5"
          className="mapview-list-heading mapview-list-heading--desktop"
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            color: '#1d1d1f',
            margin: 0,
            padding: '24px 24px 12px',
          }}
        >
          {chiropractors.length} Results
        </Heading>
        <div ref={listScrollRef} className="mapview-list-scroll">
          {chiropractors.map((chiro) => (
            <div
              key={chiro.id}
              data-chiro-id={chiro.id}
              ref={(el) => {
                if (el) listRefs.current.set(chiro.id, el);
                else listRefs.current.delete(chiro.id);
              }}
              className={`mapview-card-wrap${activeId === chiro.id ? ' mapview-card-wrap--active' : ''}`}
              onClick={() => handleListItemClick(chiro)}
              onMouseEnter={() => handleListItemHover(chiro)}
              onMouseLeave={() => handleListItemLeave(chiro)}
            >
              <ChiropractorCard
                variant="map"
                chiropractor={chiro}
                profileHref={profileHrefBuilder(chiro)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mapview-right">
        <div className="mapview-right-header">
          <Heading
            size="5"
            className="mapview-list-heading mapview-list-heading--mobile"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 700, color: '#1d1d1f', margin: 0 }}
          >
            {chiropractors.length} Results
          </Heading>
          <Flex align="center" gap="3" wrap="wrap" className="mapview-right-meta">
            <Text
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                color: 'rgba(0,0,0,0.61)',
                lineHeight: '20px',
              }}
            >
              Sorted by match score
            </Text>
            {resultsMatchAverage != null && (
              <span className="match-potential-pill" style={matchScorePillColors(resultsMatchAverage)}>
                Your filters: {resultsMatchAverage}% match potential
              </span>
            )}
          </Flex>
        </div>
        <div className="mapview-map-wrap">
          <div ref={mapContainerRef} className="mapview-map" />
          {mapReady && (
            <MapFloatingControls
              orientation={mapControlsVertical ? 'vertical' : 'horizontal'}
              onFilterClick={onFilterMapClick}
              onZoomIn={() => mapRef.current?.zoomIn({ duration: 200 })}
              onZoomOut={() => mapRef.current?.zoomOut({ duration: 200 })}
            />
          )}
        </div>
      </div>
    </div>
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
