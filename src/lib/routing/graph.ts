export type NodeType = "room" | "intersection" | "entrance" | "stairs" | "elevator" | "facility";
export type EdgeStatus = "open" | "blocked" | "construction" | "restricted";

export interface GraphNode {
  id: string;
  buildingId: string;
  floor: number;
  x: number;
  y: number;
  lat: number;
  lng: number;
  type: NodeType;
  metadata: {
    name: string;
    code: string | null;
    category: string;
    isAccessible: boolean;
    hasStairs: boolean;
    hasElevator: boolean;
  };
}

export interface GraphEdge {
  source: string;
  target: string;
  distance: number;
  floor: number;
  direction: string | null;
  isBidirectional: boolean;
  isAccessible: boolean;
  hasStairs: boolean;
  hasElevator: boolean;
  status: EdgeStatus;
}

export type AdjacencyList = Map<string, GraphEdge[]>;

export interface CampusGraph {
  adjacencyList: AdjacencyList;
  nodes: Map<string, GraphNode>;
}

export interface Location {
  id: string;
  buildingId: string;
  floor: string;
  name: string;
  category: string;
  code?: string | null;
  mapX: number;
  mapY: number;
  latitude?: number | null;
  longitude?: number | null;
  isAccessible: boolean;
  hasStairs: boolean;
  hasElevator: boolean;
  isEntrance?: boolean;
  isRestricted?: boolean;
}

export interface Path {
  fromLocationId: string;
  toLocationId: string;
  distanceMeters: number;
  direction?: string | null;
  isAccessible: boolean;
  isBidirectional?: boolean;
  hasStairs?: boolean;
  hasElevator?: boolean;
  status?: string;
}

export interface RoutingOptions {
  avoidStairs: boolean;
  wheelchairAccessible: boolean;
  avoidBlocked: boolean;
  avoidRestricted: boolean;
}

const FLOOR_VALUE: Record<string, number> = {
  BASEMENT: -1,
  GROUND: 0,
  FIRST: 1,
  SECOND: 2,
};

function mapPathStatus(status: string): EdgeStatus {
  switch (status.toUpperCase()) {
    case "OPEN":
      return "open";
    case "BLOCKED":
      return "blocked";
    case "CONSTRUCTION":
      return "construction";
    case "RESTRICTED":
      return "restricted";
    default:
      return "open";
  }
}

function resolveLocationType(loc: Location): NodeType {
  if (loc.isEntrance) return "entrance";
  switch (loc.category) {
    case "ENTRANCE":
      return "entrance";
    case "FACILITY":
    case "WASHROOM":
    case "PARKING":
    case "MEDICAL":
    case "STORE":
      return "facility";
    default:
      return "room";
  }
}

function buildNodeFromLocation(loc: Location): GraphNode {
  return {
    id: loc.id,
    buildingId: loc.buildingId,
    floor: FLOOR_VALUE[loc.floor] ?? 0,
    x: loc.mapX,
    y: loc.mapY,
    lat: loc.latitude ?? 0,
    lng: loc.longitude ?? 0,
    type: resolveLocationType(loc),
    metadata: {
      name: loc.name,
      code: loc.code ?? null,
      category: loc.category,
      isAccessible: loc.isAccessible,
      hasStairs: loc.hasStairs,
      hasElevator: loc.hasElevator,
    },
  };
}

function reverseDirection(direction: string | null): string | null {
  if (!direction) return null;
  const normalized = direction.toLowerCase();
  if (normalized.includes("north")) return "south";
  if (normalized.includes("south")) return "north";
  if (normalized.includes("east")) return "west";
  if (normalized.includes("west")) return "east";
  if (normalized.includes("left")) return "right";
  if (normalized.includes("right")) return "left";
  if (normalized.includes("up")) return "down";
  if (normalized.includes("down")) return "up";
  return direction;
}

export function buildCampusGraph(
  locations: Location[],
  paths: Path[],
): CampusGraph {
  const adjacencyList: AdjacencyList = new Map();
  const nodes = new Map<string, GraphNode>();

  for (const loc of locations) {
    adjacencyList.set(loc.id, []);
    nodes.set(loc.id, buildNodeFromLocation(loc));
  }

  for (const path of paths) {
    if (!adjacencyList.has(path.fromLocationId) || !adjacencyList.has(path.toLocationId)) continue;

    const status = path.status ? mapPathStatus(path.status) : "open";

    const edge: GraphEdge = {
      source: path.fromLocationId,
      target: path.toLocationId,
      distance: path.distanceMeters,
      floor: nodes.get(path.fromLocationId)?.floor ?? 0,
      direction: path.direction ?? null,
      isBidirectional: path.isBidirectional ?? true,
      isAccessible: path.isAccessible,
      hasStairs: path.hasStairs ?? false,
      hasElevator: path.hasElevator ?? false,
      status,
    };

    adjacencyList.get(path.fromLocationId)!.push(edge);

    if (edge.isBidirectional) {
      const reverseEdge: GraphEdge = {
        source: path.toLocationId,
        target: path.fromLocationId,
        distance: path.distanceMeters,
        floor: nodes.get(path.toLocationId)?.floor ?? 0,
        direction: reverseDirection(path.direction ?? null),
        isBidirectional: true,
        isAccessible: path.isAccessible,
        hasStairs: path.hasStairs ?? false,
        hasElevator: path.hasElevator ?? false,
        status,
      };
      adjacencyList.get(path.toLocationId)!.push(reverseEdge);
    }
  }

  return { adjacencyList, nodes };
}

export function buildAdjacencyList(
  locations: Location[],
  paths: Path[],
): AdjacencyList {
  return buildCampusGraph(locations, paths).adjacencyList;
}

export function getNeighbors(graph: AdjacencyList, nodeId: string): GraphEdge[] {
  return graph.get(nodeId) ?? [];
}

export function filterGraph(graph: AdjacencyList, options: RoutingOptions): AdjacencyList {
  const filtered: AdjacencyList = new Map();

  for (const [nodeId, edges] of graph) {
    const filteredEdges = edges.filter((edge) => {
      if (options.avoidStairs && edge.hasStairs && !edge.hasElevator) return false;
      if (options.wheelchairAccessible && !edge.isAccessible) return false;
      if (options.avoidBlocked && edge.status === "blocked") return false;
      if (options.avoidRestricted && (edge.status === "restricted" || edge.status === "construction")) return false;
      return true;
    });
    filtered.set(nodeId, filteredEdges);
  }

  return filtered;
}

export function getNodePosition(graph: AdjacencyList, nodeId: string): { x: number; y: number } | null {
  for (const [id] of graph) {
    if (id === nodeId) {
      return null;
    }
  }
  return null;
}

export function nodeCount(graph: AdjacencyList): number {
  return graph.size;
}

export function edgeCount(graph: AdjacencyList): number {
  let count = 0;
  for (const edges of graph.values()) {
    count += edges.length;
  }
  return count;
}
