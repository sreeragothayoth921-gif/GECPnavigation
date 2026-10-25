'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { CATEGORY_COLORS, MAP_CENTER, MAP_ZOOM } from '@/lib/maps/mapConfig';
import campusBuildings from '@/data/campus-buildings.json';
import campusLocations from '@/data/campus-locations.json';
import campusPaths from '@/data/campus-paths.json';

interface CampusMapProps {
  onLocationSelect?: (id: string) => void;
  onBuildingSelect?: (id: string) => void;
  selectedLocationId?: string | null;
  selectedBuildingId?: string | null;
  routePath?: Array<{ lat: number; lng: number }> | null;
  userLocation?: { lat: number; lng: number } | null;
  showPaths?: boolean;
  floor?: string;
}

export default function CampusMap({
  onLocationSelect,
  onBuildingSelect,
  selectedLocationId,
  selectedBuildingId,
  routePath,
  userLocation,
  showPaths = true,
  floor,
}: CampusMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const routeLayerRef = useRef<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        name: 'CampusNav Light',
        sources: {
          'osm-raster': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors',
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
      center: [MAP_CENTER[0], MAP_CENTER[1]],
      zoom: MAP_ZOOM,
      minZoom: 15,
      maxZoom: 21,
      attributionControl: false,
    });

    map.current.addControl(
      new maplibregl.NavigationControl({ showCompass: true, showZoom: true }),
      'bottom-right'
    );

    map.current.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

    map.current.on('load', () => {
      // Add building markers
      const buildings = campusBuildings as any[];
      buildings.forEach((building: any) => {
        if (!building.latitude || !building.longitude) return;

        const el = document.createElement('div');
        el.className = 'building-marker';
        el.style.cssText = `
          width: 40px; height: 40px; border-radius: 12px;
          background: white;
          border: 2px solid #3B82F6;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        `;
        el.innerHTML = `<span style="font-size: 18px;">🏛️</span>`;
        el.title = building.name;

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.15)';
          el.style.boxShadow = '0 4px 16px rgba(59,130,246,0.3)';
          el.style.borderColor = '#2563EB';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
          el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
          el.style.borderColor = '#3B82F6';
        });

        const popup = new maplibregl.Popup({ offset: 15, closeButton: false, className: 'location-popup' })
          .setHTML(`
            <div style="padding: 10px 14px; font-family: system-ui, -apple-system, sans-serif;">
              <div style="font-weight: 600; font-size: 14px; color: #1E293B;">${building.name}</div>
              <div style="font-size: 12px; color: #64748B; margin-top: 2px;">${building.code}</div>
            </div>
          `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([building.longitude, building.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        el.addEventListener('click', () => {
          if (onBuildingSelect) onBuildingSelect(building.id);
        });
      });

      // Add location markers
      const locations = campusLocations as any[];
      const filteredLocations = floor
        ? locations.filter((l: any) => l.floor === floor && l.latitude && l.longitude)
        : locations.filter((l: any) => l.latitude && l.longitude);

      filteredLocations.forEach((loc: any) => {
        const color = CATEGORY_COLORS[loc.category] || '#64748B';
        const el = document.createElement('div');
        el.className = 'location-marker';
        el.style.cssText = `
          width: 12px; height: 12px; border-radius: 50%;
          background: ${color}; border: 2.5px solid white;
          cursor: pointer; transition: all 0.2s ease;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        `;

        const popup = new maplibregl.Popup({ offset: 10, closeButton: false, className: 'location-popup' })
          .setHTML(`
            <div style="padding: 8px 12px; font-family: system-ui, -apple-system, sans-serif;">
              <div style="font-weight: 600; font-size: 13px; color: #1E293B;">${loc.name}</div>
              <div style="font-size: 11px; color: #64748B; margin-top: 1px;">${loc.code || ''} · ${loc.floor} Floor</div>
            </div>
          `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([loc.longitude, loc.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        el.addEventListener('click', () => {
          if (onLocationSelect) onLocationSelect(loc.id);
        });

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.4)';
          el.style.boxShadow = `0 2px 8px ${color}60`;
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
          el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.2)';
        });

        markersRef.current.push(marker);
      });

      // Add path lines
      if (showPaths) {
        const paths = campusPaths as any[];
        const locMap = new Map(locations.map((l: any) => [l.id, l]));

        const lineFeatures = paths
          .filter((p: any) => {
            const src = locMap.get(p.sourceId);
            const dst = locMap.get(p.destinationId);
            return src && dst && src.latitude && dst.latitude;
          })
          .map((p: any) => {
            const src = locMap.get(p.sourceId);
            const dst = locMap.get(p.destinationId);
            return {
              type: 'Feature' as const,
              geometry: {
                type: 'LineString' as const,
                coordinates: [[src.longitude, src.latitude], [dst.longitude, dst.latitude]],
              },
              properties: { status: p.status, distance: p.distanceMeters },
            };
          });

        map.current!.addSource('paths', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: lineFeatures },
        });

        map.current!.addLayer({
          id: 'paths-line-bg',
          type: 'line',
          source: 'paths',
          paint: {
            'line-color': '#94A3B8',
            'line-width': 4,
            'line-opacity': 0.15,
          },
        });

        map.current!.addLayer({
          id: 'paths-line',
          type: 'line',
          source: 'paths',
          paint: {
            'line-color': [
              'match', ['get', 'status'],
              'BLOCKED', '#EF4444',
              'CONSTRUCTION', '#F59E0B',
              'RESTRICTED', '#F97316',
              '#64748B'
            ],
            'line-width': 2,
            'line-opacity': 0.5,
            'line-dasharray': [2, 2],
          },
        });
      }
    });

    return () => { map.current?.remove(); };
  }, [floor, showPaths]);

  // Draw route
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    if (routeLayerRef.current) {
      map.current.removeLayer(routeLayerRef.current);
      map.current.removeLayer(`${routeLayerRef.current}-bg`);
      map.current.removeSource('route');
      routeLayerRef.current = null;
    }

    if (routePath && routePath.length > 1) {
      const coords = routePath.map(p => [p.lng, p.lat]);

      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords },
          properties: {},
        },
      });

      map.current.addLayer({
        id: 'route-line-bg',
        type: 'line',
        source: 'route',
        paint: { 'line-color': '#3B82F6', 'line-width': 8, 'line-opacity': 0.2, 'line-blur': 4 },
      });

      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        paint: { 'line-color': '#2563EB', 'line-width': 4, 'line-opacity': 1 },
      });

      routeLayerRef.current = 'route-line';

      const bounds = new maplibregl.LngLatBounds();
      coords.forEach(c => bounds.extend(c as [number, number]));
      map.current.fitBounds(bounds, { padding: 80 });
    }
  }, [routePath]);

  // User location marker
  useEffect(() => {
    if (!map.current || !userLocation) return;

    const el = document.createElement('div');
    el.className = 'user-location-marker';
    el.style.cssText = `
      width: 20px; height: 20px; border-radius: 50%;
      background: #3B82F6; border: 3px solid white;
      box-shadow: 0 2px 12px rgba(59, 130, 246, 0.4);
      position: relative;
    `;
    el.innerHTML = `<div style="position:absolute;inset:-8px;border-radius:50%;border:2px solid #3B82F6;animation:pulse-location 2s ease-in-out infinite;"></div>`;

    new maplibregl.Marker({ element: el })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map.current);

    map.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 17 });
  }, [userLocation]);

  return (
    <div ref={mapContainer} className="w-full h-full rounded-xl overflow-hidden" />
  );
}
