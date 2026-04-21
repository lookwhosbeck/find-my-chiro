import './globals.css';
import type { Metadata } from 'next';

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={HOST_GROTESK_HREF} />
      </head>
      <body>{children}</body>
    </html>
  );
}
