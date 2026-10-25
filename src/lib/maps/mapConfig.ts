export interface MapStyleConfig {
  name: string;
  version: number;
  sources: Record<string, { type: string; url: string; tileSize?: number }>;
  layers: MapLayerConfig[];
  glyphs: string;
  sprite: string;
}

export const MAP_CENTER: [number, number] = [76.3498, 10.8505];
export const MAP_ZOOM = 17;

export interface MapLayerConfig {
  id: string;
  type: string;
  source?: string;
  "source-layer"?: string;
  layout?: Record<string, unknown>;
  paint?: Record<string, unknown>;
  filter?: unknown[];
}

export const DARK_MAP_STYLE_URL = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export const CAMPUS_VIEWPORT = {
  center: { lat: 10.8505, lng: 76.3498 },
  zoom: 18,
  minZoom: 15,
  maxZoom: 22,
  pitch: 0,
  bearing: 0,
} as const;

export const BUILDING_STYLES = {
  default: {
    fillColor: "#1e3a5f",
    fillOpacity: 0.6,
    strokeColor: "#3b82f6",
    strokeWidth: 2,
  },
  hover: {
    fillColor: "#2563eb",
    fillOpacity: 0.8,
    strokeColor: "#60a5fa",
    strokeWidth: 3,
  },
  selected: {
    fillColor: "#3b82f6",
    fillOpacity: 0.9,
    strokeColor: "#93c5fd",
    strokeWidth: 3,
  },
  academic: {
    fillColor: "#1e3a5f",
    fillOpacity: 0.6,
    strokeColor: "#3b82f6",
    strokeWidth: 2,
  },
  administrative: {
    fillColor: "#3b1f5e",
    fillOpacity: 0.6,
    strokeColor: "#8b5cf6",
    strokeWidth: 2,
  },
  library: {
    fillColor: "#064e3b",
    fillOpacity: 0.6,
    strokeColor: "#10b981",
    strokeWidth: 2,
  },
  cafeteria: {
    fillColor: "#7f1d1d",
    fillOpacity: 0.6,
    strokeColor: "#ef4444",
    strokeWidth: 2,
  },
  parking: {
    fillColor: "#374151",
    fillOpacity: 0.5,
    strokeColor: "#6b7280",
    strokeWidth: 1,
  },
} as const;

export const PATH_STYLES = {
  default: {
    lineColor: "#94a3b8",
    lineWidth: 3,
    lineOpacity: 0.8,
    lineCap: "round" as const,
    lineJoin: "round" as const,
  },
  activeRoute: {
    lineColor: "#22c55e",
    lineWidth: 5,
    lineOpacity: 1,
    lineCap: "round" as const,
    lineJoin: "round" as const,
    lineDasharray: [2, 1],
  },
  blocked: {
    lineColor: "#ef4444",
    lineWidth: 3,
    lineOpacity: 0.6,
    lineCap: "round" as const,
    lineJoin: "round" as const,
    lineDasharray: [4, 4],
  },
  restricted: {
    lineColor: "#f59e0b",
    lineWidth: 2,
    lineOpacity: 0.5,
    lineCap: "round" as const,
    lineJoin: "round" as const,
    lineDasharray: [6, 3],
  },
} as const;

export const MARKER_ICONS: Record<string, { icon: string; color: string; size: number }> = {
  LECTURE_HALL: { icon: "book-open", color: "#3b82f6", size: 28 },
  LAB: { icon: "flask-conical", color: "#ec4899", size: 28 },
  OFFICE: { icon: "briefcase", color: "#8b5cf6", size: 28 },
  LIBRARY: { icon: "book-marked", color: "#10b981", size: 32 },
  CANTEEN: { icon: "utensils", color: "#ef4444", size: 30 },
  WASHROOM: { icon: "bath", color: "#06b6d4", size: 24 },
  SEMINAR_HALL: { icon: "presentation", color: "#7c3aed", size: 30 },
  ADMIN: { icon: "building-2", color: "#f59e0b", size: 28 },
  FACILITY: { icon: "settings", color: "#6b7280", size: 24 },
  ENTRANCE: { icon: "door-open", color: "#22c55e", size: 32 },
  PARKING: { icon: "car", color: "#64748b", size: 28 },
  MEDICAL: { icon: "heart-pulse", color: "#dc2626", size: 28 },
  STORE: { icon: "package", color: "#d97706", size: 24 },
  OTHER: { icon: "map-pin", color: "#94a3b8", size: 24 },
} as const;

export const CATEGORY_COLORS: Record<string, string> = {
  LECTURE_HALL: "#3b82f6",
  LAB: "#ec4899",
  OFFICE: "#8b5cf6",
  LIBRARY: "#10b981",
  CANTEEN: "#ef4444",
  WASHROOM: "#06b6d4",
  SEMINAR_HALL: "#7c3aed",
  ADMIN: "#f59e0b",
  FACILITY: "#6b7280",
  ENTRANCE: "#22c55e",
  PARKING: "#64748b",
  MEDICAL: "#dc2626",
  STORE: "#d97706",
  OTHER: "#94a3b8",
};

export function getBuildingStyle(category: string, state: "default" | "hover" | "selected" = "default") {
  const baseStyle = BUILDING_STYLES[state] || BUILDING_STYLES.default;
  const categoryStyle = BUILDING_STYLES[category as keyof typeof BUILDING_STYLES] || BUILDING_STYLES.academic;
  return { ...categoryStyle, ...baseStyle };
}

export function getPathStyle(status: string, isActive: boolean = false) {
  if (isActive) return PATH_STYLES.activeRoute;
  if (status === "BLOCKED") return PATH_STYLES.blocked;
  if (status === "RESTRICTED") return PATH_STYLES.restricted;
  return PATH_STYLES.default;
}

export function getMarkerStyle(category: string) {
  return MARKER_ICONS[category] || MARKER_ICONS.OTHER;
}

export const CAMPUS_MAP_LAYERS: MapLayerConfig[] = [
  {
    id: "campus-boundary",
    type: "line",
    source: "campus",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#3b82f6",
      "line-width": 3,
      "line-opacity": 0.6,
    },
    filter: ["==", "$type", "Polygon"],
  },
  {
    id: "building-fills",
    type: "fill",
    source: "campus",
    paint: {
      "fill-color": ["get", "fillColor", ["get", "feature"]],
      "fill-opacity": ["case", ["boolean", ["get", "isSelected"], false], 0.9, ["boolean", ["get", "isHovered"], false], 0.8, 0.6],
    },
    filter: ["==", "$type", "Polygon"],
  },
  {
    id: "building-outlines",
    type: "line",
    source: "campus",
    paint: {
      "line-color": ["case", ["boolean", ["get", "isSelected"], false], "#93c5fd", ["boolean", ["get", "isHovered"], false], "#60a5fa", "#3b82f6"],
      "line-width": ["case", ["boolean", ["get", "isSelected"], false], 3, ["boolean", ["get", "isHovered"], false], 3, 2],
    },
    filter: ["==", "$type", "Polygon"],
  },
  {
    id: "path-lines",
    type: "line",
    source: "campus",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": ["match", ["get", "status"], "OPEN", "#94a3b8", "BLOCKED", "#ef4444", "RESTRICTED", "#f59e0b", "#94a3b8"],
      "line-width": ["case", ["boolean", ["get", "isActive"], false], 5, 3],
      "line-opacity": 0.8,
    },
    filter: ["==", "$type", "LineString"],
  },
  {
    id: "route-highlight",
    type: "line",
    source: "campus",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#22c55e",
      "line-width": 5,
      "line-opacity": 1,
    },
    filter: ["all", ["==", "$type", "LineString"], ["==", "isActive", true]],
  },
  {
    id: "location-markers",
    type: "symbol",
    source: "campus",
    layout: {
      "icon-image": ["get", "icon"],
      "icon-size": ["get", "markerSize"],
      "icon-allow-overlap": true,
      "text-field": ["get", "name"],
      "text-font": ["Open Sans Regular"],
      "text-size": 11,
      "text-offset": [0, 1.5],
      "text-anchor": "top",
    },
    paint: {
      "text-color": "#e2e8f0",
      "text-halo-color": "#1e293b",
      "text-halo-width": 1,
    },
    filter: ["==", "$type", "Point"],
  },
];
