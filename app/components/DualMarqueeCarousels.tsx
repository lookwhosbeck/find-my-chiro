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
  const topLoop = rowTop.length > 0 ? [...rowTop, ...rowTop] : [];
  const bottomLoop = rowBottom.length > 0 ? [...rowBottom, ...rowBottom] : [];

  return (
    <div className={styles.wrap}>
      {topLoop.length > 0 ? (
        <div className={styles.viewport}>
          <div className={styles.trackLeft}>
            {topLoop.map((c, i) => (
              <div key={`${c.id}-t-${i}`} className={styles.cardSlot}>
                <ChiropractorCard
                  chiropractor={c}
                  marketingMatchPercent={marketingPercentFromId(c.id)}
                  variant="marquee"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {bottomLoop.length > 0 ? (
        <div className={styles.viewport}>
          <div className={styles.trackRight}>
            {bottomLoop.map((c, i) => (
              <div key={`${c.id}-b-${i}`} className={styles.cardSlot}>
                <ChiropractorCard
                  chiropractor={c}
                  marketingMatchPercent={marketingPercentFromId(c.id)}
                  variant="marquee"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
