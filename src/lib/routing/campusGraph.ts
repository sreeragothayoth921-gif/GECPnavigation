import { prisma } from "../database/prisma";
import { buildCampusGraph } from "./graph";
import type { AdjacencyList, GraphNode, GraphEdge, Location, Path } from "./graph";

interface CampusGraphData {
  graph: AdjacencyList;
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
}

let cachedGraph: CampusGraphData | null = null;

function prismaFloorToString(floor: string): string {
  switch (floor) {
    case "BASEMENT":
      return "BASEMENT";
    case "GROUND":
      return "GROUND";
    case "FIRST":
      return "FIRST";
    case "SECOND":
      return "SECOND";
    default:
      return "GROUND";
  }
}

export async function loadCampusGraph(): Promise<CampusGraphData> {
  if (cachedGraph) return cachedGraph;

  const [dbLocations, dbPaths] = await Promise.all([
    prisma.location.findMany({
      select: {
        id: true,
        buildingId: true,
        floor: true,
        name: true,
        category: true,
        code: true,
        mapX: true,
        mapY: true,
        latitude: true,
        longitude: true,
        isAccessible: true,
        hasStairs: true,
        hasElevator: true,
        isEntrance: true,
        isRestricted: true,
      },
    }),
    prisma.path.findMany({
      where: { status: "OPEN" },
      select: {
        sourceId: true,
        destinationId: true,
        distanceMeters: true,
        direction: true,
        floor: true,
        isBidirectional: true,
        isAccessible: true,
        hasStairs: true,
        hasElevator: true,
        status: true,
      },
    }),
  ]);

  const locations: Location[] = dbLocations.map((loc) => ({
    id: loc.id,
    buildingId: loc.buildingId,
    floor: prismaFloorToString(loc.floor),
    name: loc.name,
    category: loc.category,
    code: loc.code,
    mapX: loc.mapX,
    mapY: loc.mapY,
    latitude: loc.latitude,
    longitude: loc.longitude,
    isAccessible: loc.isAccessible,
    hasStairs: loc.hasStairs,
    hasElevator: loc.hasElevator,
    isEntrance: loc.isEntrance,
    isRestricted: loc.isRestricted,
  }));

  const paths: Path[] = dbPaths.map((p) => ({
    fromLocationId: p.sourceId,
    toLocationId: p.destinationId,
    distanceMeters: p.distanceMeters,
    direction: p.direction,
    isAccessible: p.isAccessible,
    isBidirectional: p.isBidirectional,
    hasStairs: p.hasStairs,
    hasElevator: p.hasElevator,
    status: p.status,
  }));

  const { adjacencyList, nodes } = buildCampusGraph(locations, paths);

  const allEdges: GraphEdge[] = [];
  for (const edges of adjacencyList.values()) {
    allEdges.push(...edges);
  }

  cachedGraph = {
    graph: adjacencyList,
    nodes,
    edges: allEdges,
  };

  return cachedGraph;
}

export function refreshGraph(): void {
  cachedGraph = null;
}
