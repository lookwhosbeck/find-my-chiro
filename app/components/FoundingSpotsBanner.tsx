'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import styles from './FoundingSpotsBanner.module.css';

const HIDDEN_PREFIXES = ['/account', '/admin', '/dev', '/review-signup'] as const;

type FoundingSpotsBannerProps = {
  remaining: number;
  cap: number;
};

function hideBanner(pathname: string): boolean {
  return HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Site-wide count of unclaimed founding-member spots. Hidden on app shells. */
export function FoundingSpotsBanner({ remaining, cap }: FoundingSpotsBannerProps) {
  const pathname = usePathname() ?? '/';
  if (remaining <= 0 || hideBanner(pathname)) return null;

  const count = remaining.toLocaleString();
  const capLabel = cap.toLocaleString();
  const spotWord = remaining === 1 ? 'spot' : 'spots';

  return (
    <Link href="/signup" className={styles.banner}>
      <span className={styles.count}>{count}</span>
      <span>
        of {capLabel} founding {spotWord} left
      </span>
      <span className={styles.detail}>Premium free for life</span>
      <span className={styles.cta}>
        Claim a spot
        <ArrowRight size={14} aria-hidden />
      </span>
    </Link>
  );
}
