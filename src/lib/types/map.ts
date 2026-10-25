import type { Coordinates } from "./campus";

export interface MapMarker {
  id: string;
  coordinates: Coordinates;
  label: string;
  category: string;
  icon: string;
  color: string;
  isActive: boolean;
  isClickable: boolean;
  onClick?: (markerId: string) => void;
}

export interface MapPopup {
  id: string;
  markerId: string;
  coordinates: Coordinates;
  title: string;
  description: string;
  actions: PopupAction[];
  isOpen: boolean;
  offset?: { x: number; y: number };
}

export interface PopupAction {
  label: string;
  icon?: string;
  onClick: () => void;
  variant?: "default" | "primary" | "danger";
}

export interface MapViewport {
  center: Coordinates;
  zoom: number;
  bounds: MapBounds;
  pitch: number;
  bearing: number;
  isAnimating: boolean;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface FloorPlanOverlay {
  id: string;
  buildingId: string;
  floorLevel: number;
  imageUrl: string;
  bounds: MapBounds;
  opacity: number;
  isVisible: boolean;
  markers: MapMarker[];
}

export interface BuildingPolygon {
  id: string;
  buildingId: string;
  buildingName: string;
  coordinates: Coordinates[];
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWidth: number;
  isHighlighted: boolean;
  isInteractive: boolean;
  onClick?: (buildingId: string) => void;
  onHover?: (buildingId: string) => void;
}

export interface RouteLayer {
  id: string;
  pathId: string;
  coordinates: Coordinates[];
  color: string;
  width: number;
  opacity: number;
  isAnimated: boolean;
  dashArray?: number[];
  isActive: boolean;
}

export interface MapTheme {
  name: string;
  background: string;
  land: string;
  water: string;
  roads: string;
  buildings: string;
  labels: string;
  markerColors: Record<string, string>;
}

export const DEFAULT_MAP_THEME: MapTheme = {
  name: "default",
  background: "#f0f4f8",
  land: "#e2e8f0",
  water: "#93c5fd",
  roads: "#cbd5e1",
  buildings: "#94a3b8",
  labels: "#1e293b",
  markerColors: {
    academic: "#3B82F6",
    administrative: "#8B5CF6",
    library: "#10B981",
    hostel: "#F59E0B",
    cafeteria: "#EF4444",
    sports: "#06B6D4",
    parking: "#6B7280",
    workshop: "#D97706",
    lab: "#EC4899",
    auditorium: "#7C3AED",
    default: "#64748B",
  },
};
