import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kartalla',
  description: 'Selaa ja lisää tapahtumia kartalla',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Prevent the browser from zooming the UI on mobile (e.g. iOS auto-zoom when
  // focusing small form fields). The Leaflet map handles its own pinch-zoom, so
  // the map stays zoomable while the rest of the UI never scales.
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fi">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
