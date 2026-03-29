'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Flex, Text } from '@radix-ui/themes';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Chiropractor } from '../lib/queries';
import { matchScorePillColors } from '../lib/match-score-pill-colors';
import { ChiropractorCard } from './ChiropractorCard';
import { ProximitySearchBar } from './ProximitySearchBar';
import { FilterDropdowns } from './FilterDropdowns';
import { FilterMobileActionBar } from './FilterMobileActionBar';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const US_CENTER: [number, number] = [-98.5795, 39.8283];
const DEFAULT_ZOOM = 4;
const MOBILE_BP = '(max-width: 768px)';

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

function FilterGlyph() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 3.5h11M5 8h6M7 12.5h2"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface MapViewProps {
  chiropractors: Chiropractor[];
  profileHrefBuilder: (chiro: Chiropractor) => string;
  loading?: boolean;
  zipCode: string;
  searchRadius: number;
  onZipChange: (zip: string) => void;
  onRadiusChange: (radius: number) => void;
  onSearchSubmit: () => void;
  modalityOptions: string[];
  focusAreaOptions: string[];
  philosophyOptions: string[];
  paymentOptions: string[];
  selectedModalities: string[];
  selectedFocusAreas: string[];
  selectedPhilosophies: string[];
  selectedPayment: string[];
  onModalityChange: (option: string, checked: boolean) => void;
  onFocusAreaChange: (option: string, checked: boolean) => void;
  onPhilosophyChange: (option: string, checked: boolean) => void;
  onPaymentChange: (option: string, checked: boolean) => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
}

export function MapView({
  chiropractors,
  profileHrefBuilder,
  loading,
  zipCode,
  searchRadius,
  onZipChange,
  onRadiusChange,
  onSearchSubmit,
  modalityOptions,
  focusAreaOptions,
  philosophyOptions,
  paymentOptions,
  selectedModalities,
  selectedFocusAreas,
  selectedPhilosophies,
  selectedPayment,
  onModalityChange,
  onFocusAreaChange,
  onPhilosophyChange,
  onPaymentChange,
  onClearFilters,
  onApplyFilters,
}: MapViewProps) {
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const mappable = chiropractors.filter(hasCoords);

  activeIdRef.current = activeId;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(MOBILE_BP);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

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

  const scrollListToChiro = useCallback((id: string) => {
    const wrap = listRefs.current.get(id);
    if (!wrap) return;
    programmaticScrollRef.current = true;
    const mobile = typeof window !== 'undefined' && window.matchMedia(MOBILE_BP).matches;
    wrap.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: mobile ? 'center' : 'nearest',
    });
    window.setTimeout(() => { programmaticScrollRef.current = false; }, 500);
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
    popup.on('close', () => { if (popupRef.current === popup) popupRef.current = null; });
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

    map.addSource(sourceId, { type: 'geojson', data: geojson, cluster: true, clusterMaxZoom: 14, clusterRadius: 50 });
    map.addLayer({
      id: clusterId, type: 'circle', source: sourceId, filter: ['has', 'point_count'],
      paint: { 'circle-color': '#0071e3', 'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 30, 30], 'circle-opacity': 0.85 },
    });
    map.addLayer({
      id: clusterCountId, type: 'symbol', source: sourceId, filter: ['has', 'point_count'],
      layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 13 },
      paint: { 'text-color': '#ffffff' },
    });
    map.addLayer({
      id: unclusteredId, type: 'circle', source: sourceId, filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': ['case', ['>=', ['get', 'matchScore'], 90], '#30a84e', ['>=', ['get', 'matchScore'], 80], '#6cc070', '#86868b'],
        'circle-radius': 8, 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff',
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

  useEffect(() => {
    let cancelled = false;
    let observer: IntersectionObserver | undefined;
    const connect = () => {
      const root = listScrollRef.current;
      const map = mapRef.current;
      if (!root || !map || !mapReady || cancelled) return;
      const mq = window.matchMedia(MOBILE_BP);
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
            map.flyTo({ center: [chiro.longitude, chiro.latitude], zoom: Math.max(map.getZoom(), 12) });
          }
        },
        { root, threshold: [0.45, 0.55, 0.65, 0.75, 0.85, 0.95, 1] },
      );
      listRefs.current.forEach((el) => observer?.observe(el));
    };
    let rafInner = 0;
    const rafOuter = requestAnimationFrame(() => { rafInner = requestAnimationFrame(connect); });
    return () => { cancelled = true; cancelAnimationFrame(rafOuter); cancelAnimationFrame(rafInner); observer?.disconnect(); };
  }, [mapReady, chiropractors]);

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
    if (!hasCoords(chiro)) return;
    const markerEl = markersRef.current.get(chiro.id)?.getElement();
    if (markerEl) markerEl.classList.add('mapview-marker--hover');
  }, []);

  const handleListItemLeave = useCallback((chiro: Chiropractor) => {
    const markerEl = markersRef.current.get(chiro.id)?.getElement();
    if (markerEl) markerEl.classList.remove('mapview-marker--hover');
  }, []);

  const handleApplyFilters = useCallback(() => {
    onApplyFilters();
    setFiltersOpen(false);
  }, [onApplyFilters]);

  const handleCloseFilters = useCallback(() => {
    setFiltersOpen(false);
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
      {loading && <div className="search-loading-overlay" />}

      <div ref={mapContainerRef} className="mapview-map" />

      {/* Desktop: card list on the left */}
      {!isMobile && chiropractors.length > 0 && (
        <div className="mapview-overlay-left">
          <div ref={listScrollRef} className="mapview-overlay-cards">
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
      )}

      {/* Right column: search bar (top) + map controls (bottom) */}
      <div className="mapview-overlay-right">
        <div className="mapview-overlay-search">
          <ProximitySearchBar
            variant="onLight"
            navigate={false}
            zipCode={zipCode}
            searchRadius={searchRadius}
            onZipChange={onZipChange}
            onRadiusChange={onRadiusChange}
            onSubmit={onSearchSubmit}
          />
        </div>

        <div className="mapview-overlay-controls">
          <div className="mapview-zoom-group">
            <button
              type="button"
              className="mapview-zoom-btn"
              onClick={() => mapRef.current?.zoomIn({ duration: 200 })}
              aria-label="Zoom in"
            >
              <svg width={14} height={16} viewBox="0 0 14 16" fill="none" aria-hidden>
                <path d="M7 3v10M2 8h10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
              </svg>
            </button>
            <button
              type="button"
              className="mapview-zoom-btn"
              onClick={() => mapRef.current?.zoomOut({ duration: 200 })}
              aria-label="Zoom out"
            >
              <svg width={14} height={16} viewBox="0 0 14 16" fill="none" aria-hidden>
                <path d="M2 8h10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <button
            type="button"
            className="mapview-filter-btn"
            onClick={() => setFiltersOpen(true)}
            aria-label="Show filters"
          >
            <FilterGlyph />
          </button>
        </div>
      </div>

      {/* Mobile: horizontal card carousel at the bottom */}
      {isMobile && chiropractors.length > 0 && (
        <div className="mapview-overlay-bottom">
          <div ref={!isMobile ? undefined : listScrollRef} className="mapview-overlay-cards-mobile">
            {chiropractors.map((chiro) => (
              <div
                key={chiro.id}
                data-chiro-id={chiro.id}
                ref={(el) => {
                  if (el) listRefs.current.set(chiro.id, el);
                  else listRefs.current.delete(chiro.id);
                }}
                className={`mapview-card-wrap-mobile${activeId === chiro.id ? ' mapview-card-wrap--active' : ''}`}
                onClick={() => handleListItemClick(chiro)}
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
      )}

      {/* Filter flyout */}
      {filtersOpen && (
        <div className="mapview-filter-backdrop" onClick={handleCloseFilters}>
          <div
            className="mapview-filter-flyout"
            onClick={(e) => e.stopPropagation()}
          >
            <FilterMobileActionBar
              onClose={handleCloseFilters}
              onApply={handleApplyFilters}
              onClear={onClearFilters}
              placement="flyoutHeader"
            />
            <div className="mapview-filter-flyout-body">
              <FilterDropdowns
                layout="column"
                modalityOptions={modalityOptions}
                focusAreaOptions={focusAreaOptions}
                philosophyOptions={philosophyOptions}
                paymentOptions={paymentOptions}
                selectedModalities={selectedModalities}
                selectedFocusAreas={selectedFocusAreas}
                selectedPhilosophies={selectedPhilosophies}
                selectedPayment={selectedPayment}
                onModalityChange={onModalityChange}
                onFocusAreaChange={onFocusAreaChange}
                onPhilosophyChange={onPhilosophyChange}
                onPaymentChange={onPaymentChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {chiropractors.length === 0 && !loading && (
        <div className="mapview-empty-state">
          <Text size="3" style={{ color: '#6b7280', textAlign: 'center' }}>
            No chiropractors found. Try adjusting your search.
          </Text>
        </div>
      )}
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
