import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { LocationCategory, Floor, PathStatus, Prisma } from "@prisma/client";

const searchLocationsSchema = z.object({
  query: z.string().optional().describe("Search term for location name, code, or keyword"),
  category: z.enum([
    "LECTURE_HALL", "LAB", "OFFICE", "LIBRARY", "CANTEEN", "WASHROOM",
    "SEMINAR_HALL", "ADMIN", "FACILITY", "ENTRANCE", "PARKING", "MEDICAL", "STORE", "OTHER",
  ]).optional().describe("Filter by location category"),
  building: z.string().optional().describe("Filter by building code"),
  floor: z.enum(["BASEMENT", "GROUND", "FIRST", "SECOND"]).optional().describe("Filter by floor level"),
});

const calculateRouteSchema = z.object({
  origin: z.string().describe("Starting location name or ID"),
  destination: z.string().describe("Destination location name or ID"),
  preferAccessible: z.boolean().optional().describe("Prefer wheelchair-accessible routes"),
});

const getNearbyFacilitiesSchema = z.object({
  location: z.string().describe("Reference location name or ID"),
  category: z.enum(["CANTEEN", "WASHROOM", "PARKING", "MEDICAL", "LIBRARY", "STORE"]).optional(),
  radiusMeters: z.number().optional().default(200),
});

const getLocationDetailsSchema = z.object({
  locationId: z.string().describe("Location ID, code, or name to look up"),
});

const checkPathStatusSchema = z.object({
  sourceId: z.string().describe("Source location ID or name"),
  destinationId: z.string().describe("Destination location ID or name"),
});

const getFloorInfoSchema = z.object({
  buildingCode: z.string().describe("Building code (e.g., 'MAIN', 'EEE')"),
  floor: z.enum(["BASEMENT", "GROUND", "FIRST", "SECOND"]).describe("Floor level to query"),
});

async function findLocationByNameOrId(nameOrId: string) {
  const byId = await prisma.location.findUnique({
    where: { id: nameOrId },
    include: { building: { select: { id: true, code: true, name: true } } },
  });
  if (byId) return byId;

  const byCode = await prisma.location.findFirst({
    where: { code: nameOrId },
    include: { building: { select: { id: true, code: true, name: true } } },
  });
  if (byCode) return byCode;

  const byName = await prisma.location.findFirst({
    where: {
      OR: [
        { name: { equals: nameOrId, mode: "insensitive" } },
        { name: { contains: nameOrId, mode: "insensitive" } },
      ],
    },
    include: { building: { select: { id: true, code: true, name: true } } },
  });
  return byName;
}

export type ToolDefinition = {
  name: string;
  description: string;
  parameters: z.ZodType;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
};

export const tools: ToolDefinition[] = [
  {
    name: "searchLocations",
    description: "Search for locations on campus by name, category, building, or floor.",
    parameters: searchLocationsSchema,
    execute: async (args) => {
      const parsed = searchLocationsSchema.parse(args);
      const where: Prisma.LocationWhereInput = {};

      if (parsed.query) {
        where.OR = [
          { name: { contains: parsed.query, mode: "insensitive" } },
          { shortName: { contains: parsed.query, mode: "insensitive" } },
          { description: { contains: parsed.query, mode: "insensitive" } },
          { code: { contains: parsed.query, mode: "insensitive" } },
        ];
      }
      if (parsed.category) where.category = parsed.category as LocationCategory;
      if (parsed.building) {
        const building = await prisma.building.findFirst({
          where: { code: { equals: parsed.building, mode: "insensitive" } },
        });
        if (building) where.buildingId = building.id;
      }
      if (parsed.floor) where.floor = parsed.floor as Floor;

      const locations = await prisma.location.findMany({
        where,
        include: { building: { select: { id: true, code: true, name: true } } },
        orderBy: { name: "asc" },
        take: 20,
      });

      return {
        count: locations.length,
        locations: locations.map((loc) => ({
          id: loc.id,
          name: loc.name,
          code: loc.code,
          category: loc.category,
          floor: loc.floor,
          building: loc.building.name,
          buildingCode: loc.building.code,
          description: loc.description,
          latitude: loc.latitude,
          longitude: loc.longitude,
          isAccessible: loc.isAccessible,
          isRestricted: loc.isRestricted,
        })),
      };
    },
  },
  {
    name: "calculateRoute",
    description: "Calculate the shortest walking route between two locations.",
    parameters: calculateRouteSchema,
    execute: async (args) => {
      const parsed = calculateRouteSchema.parse(args);
      const origin = await findLocationByNameOrId(parsed.origin);
      const dest = await findLocationByNameOrId(parsed.destination);

      if (!origin) return { error: `Location not found: ${parsed.origin}` };
      if (!dest) return { error: `Location not found: ${parsed.destination}` };

      const allPaths = await prisma.path.findMany({
        where: { status: PathStatus.OPEN },
        include: {
          source: { select: { id: true, name: true, mapX: true, mapY: true, latitude: true, longitude: true, building: { select: { name: true } } } },
          destination: { select: { id: true, name: true, mapX: true, mapY: true, latitude: true, longitude: true, building: { select: { name: true } } } },
        },
      });

      const adjacency = new Map<string, { destId: string; distance: number; path: typeof allPaths[0] }[]>();
      for (const path of allPaths) {
        if (parsed.preferAccessible && !path.isAccessible) continue;
        if (parsed.preferAccessible && path.hasStairs && !path.hasElevator) continue;

        if (!adjacency.has(path.sourceId)) adjacency.set(path.sourceId, []);
        adjacency.get(path.sourceId)!.push({ destId: path.destinationId, distance: path.distanceMeters, path });

        if (path.isBidirectional) {
          if (!adjacency.has(path.destinationId)) adjacency.set(path.destinationId, []);
          adjacency.get(path.destinationId)!.push({ destId: path.sourceId, distance: path.distanceMeters, path });
        }
      }

      const dist = new Map<string, number>();
      const prev = new Map<string, { nodeId: string; path: typeof allPaths[0] } | null>();
      const visited = new Set<string>();
      const queue: { id: string; d: number }[] = [];

      dist.set(origin.id, 0);
      prev.set(origin.id, null);
      queue.push({ id: origin.id, d: 0 });

      while (queue.length > 0) {
        queue.sort((a, b) => a.d - b.d);
        const current = queue.shift()!;
        if (visited.has(current.id)) continue;
        visited.add(current.id);

        const neighbors = adjacency.get(current.id) || [];
        for (const neighbor of neighbors) {
          if (visited.has(neighbor.destId)) continue;
          const newDist = current.d + neighbor.distance;
          const existingDist = dist.get(neighbor.destId);
          if (existingDist === undefined || newDist < existingDist) {
            dist.set(neighbor.destId, newDist);
            prev.set(neighbor.destId, { nodeId: current.id, path: neighbor.path });
            queue.push({ id: neighbor.destId, d: newDist });
          }
        }
      }

      const totalDist = dist.get(dest.id);
      if (totalDist === undefined) {
        return {
          error: "No route found between these locations.",
          origin: origin.name,
          destination: dest.name,
          suggestion: "Try a different starting point or check if paths are blocked.",
        };
      }

      const steps: { location: string; building: string; distance: number; accumulated: number }[] = [];
      let current: string | null = dest.id;
      while (current) {
        const p = prev.get(current);
        if (!p) break;
        const pathData = p.path;
        const node = pathData.source.id === current ? pathData.source : pathData.destination;
        steps.unshift({
          location: node.name,
          building: node.building.name,
          distance: pathData.distanceMeters,
          accumulated: dist.get(current) || 0,
        });
        current = p.nodeId;
      }
      steps.unshift({
        location: origin.name,
        building: origin.building.name,
        distance: 0,
        accumulated: 0,
      });

      const walkingTimeMin = Math.ceil((totalDist / 5000) * 60);

      return {
        origin: { name: origin.name, building: origin.building.name, floor: origin.floor },
        destination: { name: dest.name, building: dest.building.name, floor: dest.floor },
        totalDistanceMeters: Math.round(totalDist),
        estimatedWalkingTimeMinutes: walkingTimeMin,
        steps,
        hasStairs: steps.some((s) => s.distance > 0),
        isAccessible: parsed.preferAccessible ?? false,
      };
    },
  },
  {
    name: "getNearbyFacilities",
    description: "Find facilities near a given location.",
    parameters: getNearbyFacilitiesSchema,
    execute: async (args) => {
      const parsed = getNearbyFacilitiesSchema.parse(args);
      const refLocation = await findLocationByNameOrId(parsed.location);
      if (!refLocation) return { error: `Location not found: ${parsed.location}` };

      const categoryFilter = parsed.category as LocationCategory | undefined;
      const allLocations = await prisma.location.findMany({
        where: {
          id: { not: refLocation.id },
          latitude: { not: null },
          longitude: { not: null },
          ...(categoryFilter ? { category: categoryFilter } : {}),
        },
        include: { building: { select: { id: true, code: true, name: true } } },
      });

      const toRadians = (deg: number) => (deg * Math.PI) / 180;
      const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371000;
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };

      const radius = parsed.radiusMeters;
      const nearby = allLocations
        .map((loc) => ({
          id: loc.id,
          name: loc.name,
          code: loc.code,
          category: loc.category,
          floor: loc.floor,
          building: loc.building.name,
          distanceMeters: haversine(
            refLocation.latitude!, refLocation.longitude!,
            loc.latitude!, loc.longitude!
          ),
        }))
        .filter((loc) => loc.distanceMeters <= radius)
        .sort((a, b) => a.distanceMeters - b.distanceMeters)
        .slice(0, 10);

      return {
        referenceLocation: { name: refLocation.name, building: refLocation.building.name },
        searchRadius: radius,
        count: nearby.length,
        facilities: nearby,
      };
    },
  },
  {
    name: "getLocationDetails",
    description: "Get detailed information about a specific location.",
    parameters: getLocationDetailsSchema,
    execute: async (args) => {
      const parsed = getLocationDetailsSchema.parse(args);
      const location = await prisma.location.findFirst({
        where: {
          OR: [
            { id: parsed.locationId },
            { code: { equals: parsed.locationId, mode: "insensitive" } },
            { name: { contains: parsed.locationId, mode: "insensitive" } },
          ],
        },
        include: {
          building: true,
          pathsFrom: {
            where: { status: PathStatus.OPEN },
            select: {
              id: true,
              distanceMeters: true,
              walkingTimeSec: true,
              destination: { select: { id: true, name: true, category: true, building: { select: { name: true } } } },
            },
          },
          pathsTo: {
            where: { status: PathStatus.OPEN },
            select: {
              id: true,
              distanceMeters: true,
              walkingTimeSec: true,
              source: { select: { id: true, name: true, category: true, building: { select: { name: true } } } },
            },
          },
        },
      });

      if (!location) return { error: `Location not found: ${parsed.locationId}` };

      return {
        id: location.id,
        name: location.name,
        code: location.code,
        category: location.category,
        floor: location.floor,
        building: {
          name: location.building.name,
          code: location.building.code,
        },
        description: location.description,
        coordinates: { latitude: location.latitude, longitude: location.longitude },
        mapPosition: { x: location.mapX, y: location.mapY },
        accessibility: {
          isAccessible: location.isAccessible,
          hasStairs: location.hasStairs,
          hasElevator: location.hasElevator,
          isEntrance: location.isEntrance,
          isRestricted: location.isRestricted,
        },
        connections: [
          ...location.pathsFrom.map((p) => ({
            to: p.destination.name,
            building: p.destination.building.name,
            distanceMeters: Math.round(p.distanceMeters),
            walkingTimeSec: p.walkingTimeSec,
          })),
          ...location.pathsTo.map((p) => ({
            to: p.source.name,
            building: p.source.building.name,
            distanceMeters: Math.round(p.distanceMeters),
            walkingTimeSec: p.walkingTimeSec,
          })),
        ],
      };
    },
  },
  {
    name: "checkPathStatus",
    description: "Check if a pathway between two locations is open, blocked, or under construction.",
    parameters: checkPathStatusSchema,
    execute: async (args) => {
      const parsed = checkPathStatusSchema.parse(args);
      const source = await findLocationByNameOrId(parsed.sourceId);
      const dest = await findLocationByNameOrId(parsed.destinationId);

      if (!source) return { error: `Source location not found: ${parsed.sourceId}` };
      if (!dest) return { error: `Destination location not found: ${parsed.destinationId}` };

      const path = await prisma.path.findFirst({
        where: {
          OR: [
            { sourceId: source.id, destinationId: dest.id },
            { sourceId: dest.id, destinationId: source.id },
          ],
        },
        include: {
          blockedPeriods: { where: { isActive: true } },
          source: { select: { name: true } },
          destination: { select: { name: true } },
        },
      });

      if (!path) {
        return {
          exists: false,
          source: source.name,
          destination: dest.name,
          message: "No direct path found between these locations.",
          suggestion: "Try finding a route using calculateRoute for indirect paths.",
        };
      }

      const blockedPeriods = path.blockedPeriods.map((bp) => ({
        reason: bp.reason,
        blockedBy: bp.blockedBy,
        startedAt: bp.startsAt,
        endsAt: bp.endsAt,
      }));

      return {
        exists: true,
        source: path.source.name,
        destination: path.destination.name,
        status: path.status,
        isOpen: path.status === PathStatus.OPEN,
        distanceMeters: Math.round(path.distanceMeters),
        walkingTimeSec: path.walkingTimeSec,
        isAccessible: path.isAccessible,
        hasStairs: path.hasStairs,
        hasElevator: path.hasElevator,
        blockedPeriods,
        blockedReason: path.status !== PathStatus.OPEN ? blockedPeriods[0]?.reason ?? "Unknown" : null,
      };
    },
  },
  {
    name: "getFloorInfo",
    description: "Get information about what's on a specific floor of a building.",
    parameters: getFloorInfoSchema,
    execute: async (args) => {
      const parsed = getFloorInfoSchema.parse(args);
      const building = await prisma.building.findFirst({
        where: { code: { equals: parsed.buildingCode, mode: "insensitive" } },
      });

      if (!building) return { error: `Building not found: ${parsed.buildingCode}` };

      const floor = parsed.floor as Floor;
      const locations = await prisma.location.findMany({
        where: { buildingId: building.id, floor },
        orderBy: { name: "asc" },
      });

      const categories = new Map<string, number>();
      for (const loc of locations) {
        categories.set(loc.category, (categories.get(loc.category) || 0) + 1);
      }

      return {
        building: building.name,
        buildingCode: building.code,
        floor,
        totalLocations: locations.length,
        categoryBreakdown: Object.fromEntries(categories),
        locations: locations.map((loc) => ({
          id: loc.id,
          name: loc.name,
          code: loc.code,
          category: loc.category,
          description: loc.description,
          isAccessible: loc.isAccessible,
          isRestricted: loc.isRestricted,
        })),
        hasElevator: locations.some((l) => l.hasElevator),
        hasStairs: locations.some((l) => l.hasStairs),
      };
    },
  },
];
