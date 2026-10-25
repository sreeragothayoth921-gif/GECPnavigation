export const DEFAULT_WALKING_SPEED_KMH = 5;
export const DEFAULT_WALKING_SPEED_MS = (DEFAULT_WALKING_SPEED_KMH * 1000) / 3600;

export const CAMPUS_CENTER = { lat: 10.8505, lng: 76.3498 } as const;

export const MAP_BOUNDS = {
  north: 10.8535,
  south: 10.8475,
  east: 76.3530,
  west: 76.3466,
} as const;

export const CAMPUS_LAT_LNG_BOUNDS: [number, number][] = [
  [MAP_BOUNDS.south, MAP_BOUNDS.west],
  [MAP_BOUNDS.north, MAP_BOUNDS.east],
];

export const BUILDING_COLORS: Record<string, string> = {
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
};

export const CATEGORY_ICONS: Record<string, string> = {
  academic: "building",
  administrative: "landmark",
  library: "book-open",
  hostel: "bed",
  cafeteria: "utensils",
  sports: "trophy",
  parking: "car",
  workshop: "wrench",
  lab: "flask-conical",
  auditorium: "mic",
  restroom: "bath",
  gate: "door-open",
  default: "map-pin",
};

export enum FloorOrder {
  BASEMENT = -2,
  LOWER_GROUND = -1,
  GROUND = 0,
  FIRST = 1,
  SECOND = 2,
  THIRD = 3,
  FOURTH = 4,
}

export const FLOOR_LABELS: Record<number, string> = {
  [-2]: "Basement",
  [-1]: "Lower Ground",
  [0]: "Ground Floor",
  [1]: "First Floor",
  [2]: "Second Floor",
  [3]: "Third Floor",
  [4]: "Fourth Floor",
};

export const WALKING_SPEED_OPTIONS = [
  { label: "Slow (3 km/h)", value: 3 },
  { label: "Normal (5 km/h)", value: 5 },
  { label: "Fast (7 km/h)", value: 7 },
];
