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
    <svg width={16} height={14} viewBox="0 0 16 14" fill="none" aria-hidden>
      <path
        d="M1 .5a.5.5 0 0 0-.46.31.5.5 0 0 0 .11.54l5.78 5.78a.25.25 0 0 1 .07.18V11c0 .13.05.26.15.35l2 2a.5.5 0 0 0 .54.11.5.5 0 0 0 .31-.46V7.31a.25.25 0 0 1 .07-.18L15.35 1.35a.5.5 0 0 0 .11-.54A.5.5 0 0 0 15 .5H1Zm-.92.12A1 1 0 0 1 1 0h14a1 1 0 0 1 .93.62 1 1 0 0 1-.22 1.09L10 7.42V13a1 1 0 0 1-.62.93 1 1 0 0 1-1.09-.22l-2-2A1 1 0 0 1 6 11l.003-3.58L.29 1.71A1 1 0 0 1 .08.62Z"
        fill="currentColor"
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
