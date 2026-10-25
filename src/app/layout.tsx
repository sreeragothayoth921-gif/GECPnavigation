import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'CampusNav GEC Palakkad',
  description: 'Navigate your campus without getting lost. Smart campus navigation powered by maps, shortest-path algorithms and AI.',
  keywords: ['campus navigation', 'GEC Palakkad', 'college map', 'wayfinding', 'Dijkstra', 'GPS navigation'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://unpkg.com/maplibre-gl@4.7.0/dist/maplibre-gl.css" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}