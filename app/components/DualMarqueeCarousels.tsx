'use client';

import { useEffect, useMemo, useState } from 'react';
import { Chiropractor } from '@/app/lib/queries';
import { ChiropractorCard } from '@/app/components/ChiropractorCard';
import styles from './DualMarqueeCarousels.module.css';

/** Card width + gap between cards (must stay in sync with `.cardSlot` + `.trackSet` gap). */
function cardStepPx(viewportWidth: number): number {
  return viewportWidth <= 640 ? 220 + 12 : 200 + 12;
}

/**
 * Duplicate a row until one copy is at least `minWidthPx` wide so the viewport is always
 * covered edge-to-edge (translateX(-50%) loop stays seamless on wide screens).
 */
function expandRowForViewport<T>(row: T[], minWidthPx: number, stepPx: number): T[] {
  if (row.length === 0) return row;
  const widthOfOneCopy = (n: number) => n * stepPx - 12;
  let expanded = [...row];
  while (widthOfOneCopy(expanded.length) < minWidthPx) {
    expanded = expanded.concat(row);
  }
  return expanded;
}

function marketingPercentFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) >>> 0;
  }
  return 78 + (h % 18);
}

function splitHalves<T>(arr: T[]): [T[], T[]] {
  const mid = Math.ceil(arr.length / 2);
  return [arr.slice(0, mid), arr.slice(mid)];
}

type DualMarqueeCarouselsProps = {
  chiropractors: Chiropractor[];
};

/** Two infinite rows: top scrolls left, bottom scrolls right at the same duration. */
export function DualMarqueeCarousels({ chiropractors }: DualMarqueeCarouselsProps) {
  /** SSR / first paint guess; `resize` syncs to real viewport immediately after mount. */
  const [viewportWidth, setViewportWidth] = useState(1600);

  useEffect(() => {
    const read = () => setViewportWidth(window.innerWidth);
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, []);

  const stepPx = useMemo(() => cardStepPx(viewportWidth), [viewportWidth]);
  /** One copy of the strip should be ≥ viewport + buffer so edges never look empty. */
  const minTrackWidth = useMemo(() => viewportWidth + stepPx * 2, [viewportWidth, stepPx]);

  const [rowTop, rowBottom] = useMemo(() => splitHalves(chiropractors), [chiropractors]);
  const rowTopWide = useMemo(
    () => expandRowForViewport(rowTop, minTrackWidth, stepPx),
    [rowTop, minTrackWidth, stepPx]
  );
  const rowBottomWide = useMemo(
    () => expandRowForViewport(rowBottom, minTrackWidth, stepPx),
    [rowBottom, minTrackWidth, stepPx]
  );

  if (chiropractors.length === 0) return null;

  const renderMarqueeCards = (row: typeof chiropractors, prefix: 't' | 'b', copy: 0 | 1) =>
    row.map((c, i) => (
      <div key={`${c.id}-${prefix}-c${copy}-${i}`} className={styles.cardSlot}>
        <ChiropractorCard
          chiropractor={c}
          marketingMatchPercent={marketingPercentFromId(c.id)}
          variant="marquee"
        />
      </div>
    ));

  return (
    <div className={styles.wrap}>
      {rowTopWide.length > 0 ? (
        <div className={styles.viewport}>
          <div className={styles.trackLeft}>
            <div className={styles.trackSet}>{renderMarqueeCards(rowTopWide, 't', 0)}</div>
            <div className={styles.trackSet} aria-hidden>
              {renderMarqueeCards(rowTopWide, 't', 1)}
            </div>
          </div>
        </div>
      ) : null}
      {rowBottomWide.length > 0 ? (
        <div className={styles.viewport}>
          <div className={styles.trackRight}>
            <div className={styles.trackSet}>{renderMarqueeCards(rowBottomWide, 'b', 0)}</div>
            <div className={styles.trackSet} aria-hidden>
              {renderMarqueeCards(rowBottomWide, 'b', 1)}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
