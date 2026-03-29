'use client';

import styles from './MapFloatingControls.module.css';

type MapFloatingControlsProps = {
  orientation?: 'horizontal' | 'vertical';
  onFilterClick?: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

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

export function MapFloatingControls({
  orientation = 'horizontal',
  onFilterClick,
  onZoomIn,
  onZoomOut,
}: MapFloatingControlsProps) {
  const isVertical = orientation === 'vertical';
  const wrapClass = [
    styles.wrap,
    isVertical ? styles.wrapVertical : styles.wrapHorizontal,
  ].join(' ');

  const zoomClass = [styles.zoom, isVertical ? styles.zoomVertical : ''].filter(Boolean).join(' ');

  return (
    <div className={wrapClass}>
      <button
        type="button"
        className={styles.filterBtn}
        onClick={onFilterClick}
        aria-label="Show search filters"
      >
        <FilterGlyph />
      </button>
      <div className={zoomClass}>
        <button type="button" className={styles.zoomBtn} onClick={onZoomIn} aria-label="Zoom in">
          <svg width={14} height={16} viewBox="0 0 14 16" fill="none" aria-hidden>
            <path d="M7 3v10M2 8h10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
          </svg>
        </button>
        <button type="button" className={styles.zoomBtn} onClick={onZoomOut} aria-label="Zoom out">
          <svg width={14} height={16} viewBox="0 0 14 16" fill="none" aria-hidden>
            <path d="M2 8h10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
