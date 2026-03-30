'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Flex, Text } from '@radix-ui/themes';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { buildChiropractorSpecialtyLine } from '../lib/chiropractor-specialty-line';
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
    <svg width={24} height={21} viewBox="0 0 16 14" fill="none" aria-hidden>
      <path
        d="M1.00024 0.5C0.797113 0.5 0.615863 0.621875 0.537738 0.809375C0.459613 0.996875 0.503363 1.2125 0.647113 1.35313L6.42836 7.13437C6.47524 7.18125 6.50024 7.24375 6.50024 7.3125V11C6.50024 11.1313 6.55336 11.2594 6.64711 11.3531L8.64711 13.3531C8.79086 13.4969 9.00649 13.5375 9.19086 13.4625C9.37524 13.3875 9.50024 13.2031 9.50024 13V7.30937C9.50024 7.24375 9.52524 7.17813 9.57211 7.13125L15.3534 1.35C15.4971 1.20625 15.5377 0.990625 15.4627 0.80625C15.3877 0.621875 15.2034 0.5 15.0002 0.5H1.00024ZM0.0752379 0.61875C0.231488 0.24375 0.597113 0 1.00024 0H15.0002C15.4034 0 15.769 0.24375 15.9252 0.61875C16.0815 0.99375 15.994 1.42187 15.7096 1.70937L10.0002 7.41562V13C10.0002 13.4031 9.75649 13.7688 9.38149 13.925C9.00649 14.0813 8.57836 13.9938 8.29086 13.7094L6.29086 11.7094C6.10336 11.5219 5.99711 11.2688 5.99711 11.0031L6.00024 7.41562L0.293988 1.70625C0.00648788 1.42188 -0.0778871 0.990625 0.0752379 0.61875Z"
        fill="currentColor"
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
      style: 'mapbox://styles/mapbox/streets-v12',
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
          <span class="mapview-popup-specialty">${buildChiropractorSpecialtyLine(chiro)}</span>
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
          specialty: buildChiropractorSpecialtyLine(c),
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
    if (!mapReady || !mapContainerRef.current || !mapRef.current) return;
    const ro = new ResizeObserver(() => {
      mapRef.current?.resize();
    });
    ro.observe(mapContainerRef.current);
    return () => ro.disconnect();
  }, [mapReady]);

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
          <span class="mapview-popup-specialty">${buildChiropractorSpecialtyLine(chiro)}</span>
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

  const proximityBar = (
    <ProximitySearchBar
      variant="onLight"
      navigate={false}
      zipCode={zipCode}
      searchRadius={searchRadius}
      onZipChange={onZipChange}
      onRadiusChange={onRadiusChange}
      onSubmit={onSearchSubmit}
      className={isMobile ? 'mapview-proximity--mobile-standalone' : undefined}
    />
  );

  return (
    <div className="mapview-root">
      {isMobile && <div className="mapview-mobile-search-outer">{proximityBar}</div>}

      <div className="mapview-container">
      {loading && <div className="search-loading-overlay" />}

      <div className="mapview-map-stack">
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
          {!isMobile && proximityBar}
        </div>

        <div className="mapview-overlay-controls">
          <div className="mapview-zoom-group">
            <button
              type="button"
              className="mapview-zoom-btn"
              onClick={() => mapRef.current?.zoomIn({ duration: 200 })}
              aria-label="Zoom in"
            >
              <svg width={21} height={21} viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M7.25 0.25C7.25 0.1125 7.1375 0 7 0C6.8625 0 6.75 0.1125 6.75 0.25V6.75H0.25C0.1125 6.75 0 6.8625 0 7C0 7.1375 0.1125 7.25 0.25 7.25H6.75V13.75C6.75 13.8875 6.8625 14 7 14C7.1375 14 7.25 13.8875 7.25 13.75V7.25H13.75C13.8875 7.25 14 7.1375 14 7C14 6.8625 13.8875 6.75 13.75 6.75H7.25V0.25Z" fill="currentColor" />
              </svg>
            </button>
            <button
              type="button"
              className="mapview-zoom-btn"
              onClick={() => mapRef.current?.zoomOut({ duration: 200 })}
              aria-label="Zoom out"
            >
              <svg width={21} height={21} viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M0 7C0 6.8625 0.1125 6.75 0.25 6.75H13.75C13.8875 6.75 14 6.8625 14 7C14 7.1375 13.8875 7.25 13.75 7.25H0.25C0.1125 7.25 0 7.1375 0 7Z" fill="currentColor" />
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

      {/* Empty state */}
      {chiropractors.length === 0 && !loading && (
        <div className="mapview-empty-state">
          <Text size="3" style={{ color: '#6b7280', textAlign: 'center' }}>
            No chiropractors found. Try adjusting your search.
          </Text>
        </div>
      )}
      </div>
      </div>

      {/* Covers map + mobile search row */}
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
    </div>
  );
}

