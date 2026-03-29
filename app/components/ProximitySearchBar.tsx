'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SEARCH_RADIUS_MILES_OPTIONS, clampSearchRadiusMiles } from '@/app/lib/search-radius';
import styles from './ProximitySearchBar.module.css';

type ProximitySearchBarProps = {
  variant: 'onDark' | 'onLight';
  navigate?: boolean;
  zipCode?: string;
  searchRadius?: number;
  onZipChange?: (zip: string) => void;
  onRadiusChange?: (radius: number) => void;
  onSubmit?: () => void;
  className?: string;
};

function SearchGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={11}
      height={11}
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6.625 11.375C9.07437 11.375 11.0625 9.38687 11.0625 6.9375C11.0625 4.48813 9.07437 2.5 6.625 2.5C4.17563 2.5 2.1875 4.48813 2.1875 6.9375C2.1875 9.38687 4.17563 11.375 6.625 11.375Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.76562 9.76562L12.8125 12.8125"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProximitySearchBar({
  variant,
  navigate: navigateProp,
  zipCode: controlledZip,
  searchRadius: controlledRadius,
  onZipChange,
  onRadiusChange,
  onSubmit,
  className,
}: ProximitySearchBarProps) {
  const router = useRouter();
  const navigate = navigateProp ?? variant === 'onDark';
  const [localZip, setLocalZip] = useState('');
  const [localRadius, setLocalRadius] = useState(25);
  const zipInputId = useId();
  const radiusId = useId();

  const zip = navigate ? localZip : (controlledZip ?? '');
  const rawRadius = navigate ? localRadius : (controlledRadius ?? 25);
  const radius = clampSearchRadiusMiles(rawRadius);

  useEffect(() => {
    if (navigate || controlledRadius == null) return;
    const c = clampSearchRadiusMiles(controlledRadius);
    if (c !== controlledRadius) onRadiusChange?.(c);
  }, [navigate, controlledRadius, onRadiusChange]);

  const setZip = useCallback(
    (z: string) => {
      if (navigate) setLocalZip(z);
      else onZipChange?.(z);
    },
    [navigate, onZipChange]
  );

  const setRadius = useCallback(
    (r: number) => {
      if (navigate) setLocalRadius(r);
      else onRadiusChange?.(r);
    },
    [navigate, onRadiusChange]
  );

  const handleSubmit = useCallback(() => {
    if (navigate) {
      const q = new URLSearchParams();
      if (zip.trim()) q.set('zip', zip.trim());
      q.set('radius', String(radius));
      router.push(`/search?${q.toString()}`);
      return;
    }
    onSubmit?.();
  }, [navigate, zip, radius, router, onSubmit]);

  const rootClass = [styles.bar, variant === 'onDark' ? styles.onDark : styles.onLight, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass}>
      <div className={styles.white}>
        <label htmlFor={zipInputId} className={styles.visuallyHidden}>
          Zip code
        </label>
        <div className={styles.iconPad} aria-hidden>
          <SearchGlyph className={styles.searchIcon} />
        </div>
        <input
          id={zipInputId}
          className={styles.zipInput}
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="Zipcode"
          maxLength={10}
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
        />
        <div className={styles.radius}>
          <label htmlFor={radiusId} className={styles.visuallyHidden}>
            Search radius
          </label>
          <select
            id={radiusId}
            className={styles.radiusSelect}
            value={String(radius)}
            onChange={(e) => setRadius(parseInt(e.target.value, 10))}
            aria-label="Distance"
          >
            {SEARCH_RADIUS_MILES_OPTIONS.map((miles) => (
              <option key={miles} value={miles}>
                {miles} miles
              </option>
            ))}
          </select>
          <span className={styles.chevron} aria-hidden />
        </div>
      </div>
      <button
        type="button"
        className={`${styles.submit} fmc-proximity-submit`}
        onClick={handleSubmit}
      >
        Find Care
      </button>
    </div>
  );
}
