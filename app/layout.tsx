import './globals.css';
import type { Metadata } from 'next';
import { Host_Grotesk } from 'next/font/google';

const hostGrotesk = Host_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-host-grotesk',
});

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
    <html lang="en" className={hostGrotesk.variable}>
      <body>{children}</body>
    </html>
  );
}
