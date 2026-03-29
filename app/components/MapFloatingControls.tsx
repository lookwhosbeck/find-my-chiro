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
    <svg width={24} height={21} viewBox="0 0 16 14" fill="none" aria-hidden>
      <path
        d="M1.00024 0.5C0.797113 0.5 0.615863 0.621875 0.537738 0.809375C0.459613 0.996875 0.503363 1.2125 0.647113 1.35313L6.42836 7.13437C6.47524 7.18125 6.50024 7.24375 6.50024 7.3125V11C6.50024 11.1313 6.55336 11.2594 6.64711 11.3531L8.64711 13.3531C8.79086 13.4969 9.00649 13.5375 9.19086 13.4625C9.37524 13.3875 9.50024 13.2031 9.50024 13V7.30937C9.50024 7.24375 9.52524 7.17813 9.57211 7.13125L15.3534 1.35C15.4971 1.20625 15.5377 0.990625 15.4627 0.80625C15.3877 0.621875 15.2034 0.5 15.0002 0.5H1.00024ZM0.0752379 0.61875C0.231488 0.24375 0.597113 0 1.00024 0H15.0002C15.4034 0 15.769 0.24375 15.9252 0.61875C16.0815 0.99375 15.994 1.42187 15.7096 1.70937L10.0002 7.41562V13C10.0002 13.4031 9.75649 13.7688 9.38149 13.925C9.00649 14.0813 8.57836 13.9938 8.29086 13.7094L6.29086 11.7094C6.10336 11.5219 5.99711 11.2688 5.99711 11.0031L6.00024 7.41562L0.293988 1.70625C0.00648788 1.42188 -0.0778871 0.990625 0.0752379 0.61875Z"
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
          <svg width={21} height={21} viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M7.25 0.25C7.25 0.1125 7.1375 0 7 0C6.8625 0 6.75 0.1125 6.75 0.25V6.75H0.25C0.1125 6.75 0 6.8625 0 7C0 7.1375 0.1125 7.25 0.25 7.25H6.75V13.75C6.75 13.8875 6.8625 14 7 14C7.1375 14 7.25 13.8875 7.25 13.75V7.25H13.75C13.8875 7.25 14 7.1375 14 7C14 6.8625 13.8875 6.75 13.75 6.75H7.25V0.25Z" fill="currentColor" />
          </svg>
        </button>
        <button type="button" className={styles.zoomBtn} onClick={onZoomOut} aria-label="Zoom out">
          <svg width={21} height={21} viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M0 7C0 6.8625 0.1125 6.75 0.25 6.75H13.75C13.8875 6.75 14 6.8625 14 7C14 7.1375 13.8875 7.25 13.75 7.25H0.25C0.1125 7.25 0 7.1375 0 7Z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  );
}
