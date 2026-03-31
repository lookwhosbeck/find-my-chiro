"use client";

import { useEffect, useMemo, useState } from "react";
import type { Chiropractor } from "@/app/lib/queries";
import { ChiropractorCard } from "@/app/components/ChiropractorCard";
import styles from "./DualMarqueeCarousels.module.css";

/** Card width + gap (keep in sync with `.cardSlot` + `.trackSet` gap). */
function cardStepPx(viewportWidth: number): number {
  const w = viewportWidth <= 640 ? 280 : 360;
  return w + 12;
}

/**
 * Repeat the list until one copy is at least `minWidthPx` wide so the viewport
 * stays covered (translateX(-50%) loops seamlessly).
 */
function expandRowForViewport<T>(
  row: T[],
  minWidthPx: number,
  stepPx: number,
): T[] {
  if (row.length === 0) return row;
  const widthOfOneCopy = (n: number) => n * stepPx - 12;
  let expanded = [...row];
  while (widthOfOneCopy(expanded.length) < minWidthPx) {
    expanded = expanded.concat(row);
  }
  return expanded;
}

type DualMarqueeCarouselsProps = {
  chiropractors: Chiropractor[];
};

/**
 * Single-row infinite marquee using the same map list card as `/search` for visual consistency.
 */
export function DualMarqueeCarousels({
  chiropractors,
}: DualMarqueeCarouselsProps) {
  const [viewportWidth, setViewportWidth] = useState(1600);

  useEffect(() => {
    const read = () => setViewportWidth(window.innerWidth);
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  const stepPx = useMemo(() => cardStepPx(viewportWidth), [viewportWidth]);
  const minTrackWidth = useMemo(
    () => viewportWidth + stepPx * 2,
    [viewportWidth, stepPx],
  );

  const rowWide = useMemo(
    () => expandRowForViewport(chiropractors, minTrackWidth, stepPx),
    [chiropractors, minTrackWidth, stepPx],
  );

  if (chiropractors.length === 0) return null;

  const renderCards = (row: Chiropractor[], copy: 0 | 1) =>
    row.map((c, i) => (
      <div key={`${c.id}-c${copy}-${i}`} className={styles.cardSlot}>
        <ChiropractorCard chiropractor={c} variant="map" />
      </div>
    ));

  return (
    <div className={styles.wrap}>
      <div className={styles.viewport}>
        <div className={styles.track}>
          <div className={styles.trackSet}>{renderCards(rowWide, 0)}</div>
          <div className={styles.trackSet} aria-hidden>
            {renderCards(rowWide, 1)}
          </div>
        </div>
      </div>
    </div>
  );
}
