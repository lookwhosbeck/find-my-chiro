import './globals.css';
import type { CSSProperties, ReactNode } from 'react';
import type { Metadata } from 'next';
import { FoundingSpotsBanner } from './components/FoundingSpotsBanner';
import { getCachedFoundingAvailability } from './lib/founding-availability.server';

/**
 * Host Grotesk isn't in Next.js 14's `next/font/google` manifest (it was added
 * in Next 15). Load it from Google Fonts via <link> so the build doesn't fail;
 * the family is referenced directly in `--font-display` in globals.css.
 */
const HOST_GROTESK_HREF =
  'https://fonts.googleapis.com/css2?family=Host+Grotesk:ital,wght@0,300..800;1,300..800&display=swap';

export const metadata: Metadata = {
  title: 'Movyn',
  description: 'Find a chiropractor near you',
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const founding = await getCachedFoundingAvailability();
  const showFoundingBanner = founding.available && founding.remaining > 0;

  return (
    <html
      lang="en"
      style={
        showFoundingBanner
          ? ({ '--founding-banner-offset': '2.5rem' } as CSSProperties)
          : undefined
      }
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={HOST_GROTESK_HREF} />
      </head>
      <body>
        {showFoundingBanner ? (
          <FoundingSpotsBanner remaining={founding.remaining} cap={founding.cap} />
        ) : null}
        {children}
      </body>
    </html>
  );
}
