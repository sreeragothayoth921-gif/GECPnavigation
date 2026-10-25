export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  category: RoomCategory;
  floor: string;
  buildingCode: string;
  polygon: Point[];
  centroid: Point;
  entrances: Point[];
  isAccessible: boolean;
  metadata?: Record<string, any>;
}

export type RoomCategory =
  | 'LECTURE_HALL'
  | 'LAB'
  | 'OFFICE'
  | 'LIBRARY'
  | 'CANTEEN'
  | 'WASHROOM'
  | 'FACILITY'
  | 'STORE'
  | 'ADMIN'
  | 'SEMINAR_HALL'
  | 'ENTRANCE'
  | 'PARKING'
  | 'MEDICAL'
  | 'CORRIDOR'
  | 'STAIRS'
  | 'ELEVATOR'
  | 'OTHER';

export interface Corridor {
  id: string;
  floor: string;
  buildingCode: string;
  polygon: Point[];
  centerline: Point[];
  connections: string[];
}

export interface Door {
  id: string;
  roomId: string;
  position: Point;
  connectsTo: 'corridor' | 'room' | 'outside';
  targetId?: string;
  isAccessible: boolean;
  type: 'standard' | 'fire' | 'auto' | 'emergency';
}

export interface NavigationNode {
  id: string;
  position: Point;
  floor: string;
  buildingCode: string;
  type: 'corridor' | 'room_entrance' | 'stair' | 'elevator' | 'intersection' | 'landmark';
  connections: NavigationEdge[];
  metadata?: {
    roomId?: string;
    corridorId?: string;
    isAccessible?: boolean;
    label?: string;
  };
}

export interface NavigationEdge {
  targetId: string;
  distance: number;
  type: 'corridor' | 'door' | 'stair' | 'elevator';
  isBidirectional: boolean;
  metadata?: {
    hasStairs?: boolean;
    hasElevator?: boolean;
    isAccessible?: boolean;
  };
}

export interface FloorPlan {
  buildingCode: string;
  floor: string;
  name: string;
  width: number;
  height: number;
  rooms: Room[];
  corridors: Corridor[];
  doors: Door[];
  navigationNodes: NavigationNode[];
  navigationEdges: NavigationEdge[];
  backgroundImage?: string;
  svgContent?: string;
  metadata: {
    scale: number;
    units: 'meters' | 'pixels';
    origin: Point;
    rotation: number;
  };
}

export interface Building {
  id: string;
  code: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  floors: FloorPlan[];
  entrances: Point[];
}

export interface IndoorRouteResult {
  path: NavigationNode[];
  edges: NavigationEdge[];
  totalDistance: number;
  totalTime: number;
  eta: Date;
  floors: string[];
  instructions: IndoorTurnInstruction[];
}

export interface IndoorTurnInstruction {
  step: number;
  action: 'continue' | 'turn_left' | 'turn_right' | 'turn_around' | 'enter_room' | 'exit_room' | 'take_stairs' | 'take_elevator' | 'arrive';
  description: string;
  distance: number;
  nodeId: string;
  floor: string;
  roomName?: string;
}

export interface IndoorMapViewport {
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
}

export const ROOM_CATEGORY_COLORS: Record<RoomCategory, string> = {
  LECTURE_HALL: '#3B82F6',
  LAB: '#8B5CF6',
  OFFICE: '#F59E0B',
  LIBRARY: '#10B981',
  CANTEEN: '#EF4444',
  WASHROOM: '#6B7280',
  FACILITY: '#6366F1',
  STORE: '#9CA3AF',
  ADMIN: '#EC4899',
  SEMINAR_HALL: '#06B6D4',
  ENTRANCE: '#22C55E',
  PARKING: '#78716C',
  MEDICAL: '#EF4444',
  CORRIDOR: '#94A3B8',
  STAIRS: '#F97316',
  ELEVATOR: '#8B5CF6',
  OTHER: '#64748B',
};

export const ROOM_CATEGORY_LABELS: Record<RoomCategory, string> = {
  LECTURE_HALL: 'Lecture Hall',
  LAB: 'Laboratory',
  OFFICE: 'Office',
  LIBRARY: 'Library',
  CANTEEN: 'Canteen',
  WASHROOM: 'Washroom',
  FACILITY: 'Facility',
  STORE: 'Store',
  ADMIN: 'Admin',
  SEMINAR_HALL: 'Seminar Hall',
  ENTRANCE: 'Entrance',
  PARKING: 'Parking',
  MEDICAL: 'Medical',
  CORRIDOR: 'Corridor',
  STAIRS: 'Stairs',
  ELEVATOR: 'Elevator',
  OTHER: 'Other',
};