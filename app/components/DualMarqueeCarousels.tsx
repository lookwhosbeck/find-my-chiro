'use client';

import { Chiropractor } from '@/app/lib/queries';
import { ChiropractorCard } from '@/app/components/ChiropractorCard';
import styles from './DualMarqueeCarousels.module.css';

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
  if (chiropractors.length === 0) return null;

  const [rowTop, rowBottom] = splitHalves(chiropractors);

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
      {rowTop.length > 0 ? (
        <div className={styles.viewport}>
          <div className={styles.trackLeft}>
            <div className={styles.trackSet}>{renderMarqueeCards(rowTop, 't', 0)}</div>
            <div className={styles.trackSet} aria-hidden>
              {renderMarqueeCards(rowTop, 't', 1)}
            </div>
          </div>
        </div>
      ) : null}
      {rowBottom.length > 0 ? (
        <div className={styles.viewport}>
          <div className={styles.trackRight}>
            <div className={styles.trackSet}>{renderMarqueeCards(rowBottom, 'b', 0)}</div>
            <div className={styles.trackSet} aria-hidden>
              {renderMarqueeCards(rowBottom, 'b', 1)}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
