export interface Building {
  id: string;
  name: string;
  shortName: string;
  category: BuildingCategory;
  description: string;
  lat: number;
  lng: number;
  floors: Floor[];
  entrances: Entrance[];
  amenities: string[];
  operatingHours: string;
  contactNumber?: string;
  imageUrl?: string;
  polygon?: Coordinates[];
  createdAt: Date;
  updatedAt: Date;
}

export enum BuildingCategory {
  ACADEMIC = "academic",
  ADMINISTRATIVE = "administrative",
  LIBRARY = "library",
  HOSTEL = "hostel",
  CAFETERIA = "cafeteria",
  SPORTS = "sports",
  PARKING = "parking",
  WORKSHOP = "workshop",
  LAB = "lab",
  AUDITORIUM = "auditorium",
  RESTROOM = "restroom",
  GATE = "gate",
}

export interface Floor {
  id: string;
  buildingId: string;
  level: number;
  name: string;
  description?: string;
  locations: Location[];
  floorPlanUrl?: string;
  facilities: string[];
}

export interface Location {
  id: string;
  buildingId: string;
  floorId: string;
  floorLevel: number;
  name: string;
  category: LocationCategory;
  description?: string;
  lat: number;
  lng: number;
  x?: number;
  y?: number;
  tags: string[];
  popularity: number;
  lastUpdated: Date;
}

export enum LocationCategory {
  CLASSROOM = "classroom",
  LABORATORY = "laboratory",
  OFFICE = "office",
  HOD_ROOM = "hod_room",
  STAFF_ROOM = "staff_room",
  TOILET = "toilet",
  ENTRANCE = "entrance",
  EXIT = "exit",
  ELEVATOR = "elevator",
  STAIRS = "stairs",
  WATER_FOUNTAIN = "water_fountain",
  NOTICE_BOARD = "notice_board",
  PARKING = "parking",
  SEATING_AREA = "seating_area",
}

export interface Entrance {
  id: string;
  buildingId: string;
  name: string;
  lat: number;
  lng: number;
  isAccessible: boolean;
  connectedPathIds: string[];
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Path {
  id: string;
  name: string;
  fromLocationId: string;
  toLocationId: string;
  fromCoordinates: Coordinates;
  toCoordinates: Coordinates;
  distanceMeters: number;
  estimatedTimeSeconds: number;
  type: PathType;
  isAccessible: boolean;
  isIndoor: boolean;
  floorLevel?: number;
  waypoints: Coordinates[];
  elevation?: number;
  surface: PathSurface;
  width: number;
  lighting: LightingLevel;
  crowdLevel: CrowdLevel;
  lastVerified: Date;
}

export enum PathType {
  OUTDOOR = "outdoor",
  INDOOR = "indoor",
  CORRIDOR = "corridor",
  STAIRCASE = "staircase",
  RAMP = "ramp",
  BRIDGE = "bridge",
}

export enum PathSurface {
  PAVED = "paved",
  TILED = "tiled",
  GRAVEL = "gravel",
  GRASS = "grass",
  CARPET = "carpet",
}

export enum LightingLevel {
  WELL_LIT = "well_lit",
  ADEQUATE = "adequate",
  DIM = "dim",
  DARK = "dark",
}

export enum CrowdLevel {
  EMPTY = "empty",
  LOW = "low",
  MODERATE = "moderate",
  HIGH = "high",
  VERY_HIGH = "very_high",
}

export interface RoutingOptions {
  avoidStairs: boolean;
  preferAccessible: boolean;
  preferOutdoor: boolean;
  walkingSpeedKmh: number;
  maxDetourMeters?: number;
  timeOfDay?: "morning" | "afternoon" | "evening" | "night";
  avoidCrowded: boolean;
}

export interface RouteResult {
  id: string;
  path: Path[];
  totalDistanceMeters: number;
  totalEstimatedTimeSeconds: number;
  turns: TurnInstruction[];
  landmarks: string[];
  weatherCondition?: string;
  alternativeRoutes: RouteResult[];
  confidence: number;
  generatedAt: Date;
}

export interface TurnInstruction {
  stepNumber: number;
  instruction: string;
  distanceMeters: number;
  estimatedTimeSeconds: number;
  turnType: TurnType;
  landmark?: string;
  coordinates: Coordinates;
  floorChange?: number;
}

export enum TurnType {
  STRAIGHT = "straight",
  LEFT = "left",
  RIGHT = "right",
  U_TURN = "u_turn",
  SLIGHT_LEFT = "slight_left",
  SLIGHT_RIGHT = "slight_right",
  ENTER_BUILDING = "enter_building",
  EXIT_BUILDING = "exit_building",
  UP_STAIRS = "up_stairs",
  DOWN_STAIRS = "down_stairs",
  USE_ELEVATOR = "use_elevator",
  ARRIVE = "arrive",
}

export interface GraphNode {
  id: string;
  locationId: string;
  coordinates: Coordinates;
  floorLevel: number;
  isIndoor: boolean;
  isAccessible: boolean;
  neighbors: string[];
}

export interface GraphEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  distanceMeters: number;
  weight: number;
  isAccessible: boolean;
  type: PathType;
}

export type AdjacencyList = Map<string, GraphEdge[]>;

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  preferences: UserPreferences;
  favoriteLocations: string[];
  recentSearches: string[];
  navigationHistory: NavigationSession[];
  createdAt: Date;
  lastLoginAt: Date;
}

export enum UserRole {
  STUDENT = "student",
  FACULTY = "faculty",
  STAFF = "staff",
  ADMIN = "admin",
}

export interface UserPreferences {
  walkingSpeedKmh: number;
  preferAccessible: boolean;
  preferOutdoor: boolean;
  avoidStairs: boolean;
  darkMode: boolean;
  language: string;
  notificationsEnabled: boolean;
}

export interface NavigationSession {
  id: string;
  userId: string;
  fromLocationId: string;
  toLocationId: string;
  route: RouteResult;
  startedAt: Date;
  completedAt?: Date;
  status: NavigationStatus;
  deviationCount: number;
  feedback?: NavigationFeedback;
}

export enum NavigationStatus {
  PLANNED = "planned",
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  DEVIATED = "deviated",
}

export interface NavigationFeedback {
  rating: number;
  comment?: string;
  reportedIssues: UserReport[];
  submittedAt: Date;
}

export interface UserReport {
  id: string;
  userId: string;
  type: ReportType;
  locationId?: string;
  pathId?: string;
  description: string;
  severity: ReportSeverity;
  status: ReportStatus;
  images?: string[];
  coordinates: Coordinates;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export enum ReportType {
  BLOCKED_PATH = "blocked_path",
  DAMAGED_PATH = "damaged_path",
  POOR_LIGHTING = "poor_lighting",
  SAFETY_CONCERN = "safety_concern",
  WRONG_INFO = "wrong_info",
  SUGGESTION = "suggestion",
  CLEANLINESS = "cleanliness",
  NOISE = "noise",
}

export enum ReportSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum ReportStatus {
  PENDING = "pending",
  REVIEWED = "reviewed",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  DISMISSED = "dismissed",
}

export interface AdminStats {
  totalBuildings: number;
  totalLocations: number;
  totalPaths: number;
  totalUsers: number;
  activeNavigationSessions: number;
  pendingReports: number;
  avgRouteRating: number;
  popularDestinations: { locationId: string; name: string; count: number }[];
  recentActivity: AdminActivity[];
}

export interface AdminActivity {
  id: string;
  type: string;
  description: string;
  userId: string;
  timestamp: Date;
}

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}
