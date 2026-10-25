'use client';

import { create } from 'zustand';

interface MapState {
  selectedLocationId: string | null;
  selectedBuildingId: string | null;
  hoveredLocationId: string | null;
  hoveredBuildingId: string | null;
  currentFloor: 'BASEMENT' | 'GROUND' | 'FIRST' | 'SECOND';
  is3DMode: boolean;
  showFloorPlan: boolean;
  showPaths: boolean;
  showLabels: boolean;
  mapCenter: [number, number];
  mapZoom: number;
  userLocation: { lat: number; lng: number } | null;
  isUsingGPS: boolean;
  setSelectedLocation: (id: string | null) => void;
  setSelectedBuilding: (id: string | null) => void;
  setHoveredLocation: (id: string | null) => void;
  setHoveredBuilding: (id: string | null) => void;
  setCurrentFloor: (floor: 'BASEMENT' | 'GROUND' | 'FIRST' | 'SECOND') => void;
  toggle3DMode: () => void;
  setShowFloorPlan: (show: boolean) => void;
  setShowPaths: (show: boolean) => void;
  setShowLabels: (show: boolean) => void;
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;
  setIsUsingGPS: (using: boolean) => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedLocationId: null,
  selectedBuildingId: null,
  hoveredLocationId: null,
  hoveredBuildingId: null,
  currentFloor: 'GROUND',
  is3DMode: false,
  showFloorPlan: false,
  showPaths: true,
  showLabels: true,
  mapCenter: [76.3498, 10.8505],
  mapZoom: 17,
  userLocation: null,
  isUsingGPS: false,
  setSelectedLocation: (id) => set({ selectedLocationId: id }),
  setSelectedBuilding: (id) => set({ selectedBuildingId: id }),
  setHoveredLocation: (id) => set({ hoveredLocationId: id }),
  setHoveredBuilding: (id) => set({ hoveredBuildingId: id }),
  setCurrentFloor: (floor) => set({ currentFloor: floor, showFloorPlan: true }),
  toggle3DMode: () => set((state) => ({ is3DMode: !state.is3DMode })),
  setShowFloorPlan: (show) => set({ showFloorPlan: show }),
  setShowPaths: (show) => set({ showPaths: show }),
  setShowLabels: (show) => set({ showLabels: show }),
  setMapCenter: (center) => set({ mapCenter: center }),
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
  setUserLocation: (loc) => set({ userLocation: loc }),
  setIsUsingGPS: (using) => set({ isUsingGPS: using }),
}));