'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

interface MiniMapProps {
  coords: Array<{ lat: number; lng: number }>;
  startName?: string;
  endName?: string;
  activeStep?: number;
  directions?: Array<{ step: number; instruction: string; distance: string; icon: string }>;
}

export default function MiniMap({ coords, startName, endName, activeStep, directions }: MiniMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !coords || coords.length < 2) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        name: 'MiniMap',
        sources: {
          'osm-raster': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: 'osm-base',
            type: 'raster',
            source: 'osm-raster',
            paint: {
              'raster-brightness-max': 1.0,
              'raster-contrast': 0.05,
              'raster-saturation': -0.1,
            },
          },
        ],
      },
      center: [coords[0].lng, coords[0].lat],
      zoom: 17,
      attributionControl: false,
      interactive: true,
    });

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false, showZoom: false }), 'bottom-right');

    map.current.on('load', () => {
      if (!map.current) return;

      const lineCoords = coords.map(c => [c.lng, c.lat]);

      // Route background (wide, translucent)
      map.current.addSource('route-bg', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: lineCoords },
          properties: {},
        },
      });

      map.current.addLayer({
        id: 'route-bg-line',
        type: 'line',
        source: 'route-bg',
        paint: {
          'line-color': '#3B82F6',
          'line-width': 8,
          'line-opacity': 0.2,
          'line-blur': 4,
        },
      });

      // Route main line
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: lineCoords },
          properties: {},
        },
      });

      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': '#2563EB',
          'line-width': 4,
          'line-opacity': 1,
        },
      });

      // Start marker
      const startEl = document.createElement('div');
      startEl.style.cssText = `
        width: 16px; height: 16px; border-radius: 50%;
        background: #22C55E; border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      `;
      new maplibregl.Marker({ element: startEl })
        .setLngLat([coords[0].lng, coords[0].lat])
        .setPopup(new maplibregl.Popup({ offset: 10, closeButton: false }).setText(startName || 'Start'))
        .addTo(map.current);

      // End marker
      const endEl = document.createElement('div');
      endEl.style.cssText = `
        width: 16px; height: 16px; border-radius: 50%;
        background: #EF4444; border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      `;
      new maplibregl.Marker({ element: endEl })
        .setLngLat([coords[coords.length - 1].lng, coords[coords.length - 1].lat])
        .setPopup(new maplibregl.Popup({ offset: 10, closeButton: false }).setText(endName || 'Destination'))
        .addTo(map.current);

      // Fit bounds
      const bounds = new maplibregl.LngLatBounds();
      coords.forEach(c => bounds.extend([c.lng, c.lat]));
      map.current.fitBounds(bounds, { padding: 40 });
    });

    return () => { map.current?.remove(); };
  }, [coords, startName, endName]);

  return (
    <div ref={mapContainer} className="w-full h-full" />
  );
}
