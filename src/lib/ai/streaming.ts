import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { LocationCategory, Floor, PathStatus, Prisma } from "@prisma/client";
import { getSystemPrompt, type ChatContext } from "./systemPrompt";
import { getOfflineResponse } from "./fallback";

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

const campusTools = {
  searchLocations: tool({
    description: "Search for locations on campus by name, category, building, or floor.",
    parameters: z.object({
      query: z.string().optional().describe("Search term for location name, code, or keyword"),
      category: z.enum([
        "LECTURE_HALL", "LAB", "OFFICE", "LIBRARY", "CANTEEN", "WASHROOM",
        "SEMINAR_HALL", "ADMIN", "FACILITY", "ENTRANCE", "PARKING", "MEDICAL", "STORE", "OTHER",
      ]).optional().describe("Filter by location category"),
      building: z.string().optional().describe("Filter by building code"),
      floor: z.enum(["BASEMENT", "GROUND", "FIRST", "SECOND"]).optional().describe("Filter by floor level"),
    }),
    execute: async ({ query, category, building, floor }) => {
      const where: Prisma.LocationWhereInput = {};
      if (query) {
        where.OR = [
          { name: { contains: query, mode: "insensitive" } },
          { shortName: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { code: { contains: query, mode: "insensitive" } },
        ];
      }
      if (category) where.category = category as LocationCategory;
      if (building) {
        const b = await prisma.building.findFirst({ where: { code: { equals: building, mode: "insensitive" } } });
        if (b) where.buildingId = b.id;
      }
      if (floor) where.floor = floor as Floor;

      const locations = await prisma.location.findMany({
        where,
        include: { building: { select: { id: true, code: true, name: true } } },
        orderBy: { name: "asc" },
        take: 20,
      });

      return locations.map((loc) => ({
        id: loc.id,
        name: loc.name,
        code: loc.code,
        category: loc.category,
        floor: loc.floor,
        building: loc.building.name,
        buildingCode: loc.building.code,
        description: loc.description,
        isAccessible: loc.isAccessible,
      }));
    },
  }),

  calculateRoute: tool({
    description: "Calculate the shortest walking route between two locations.",
    parameters: z.object({
      origin: z.string().describe("Starting location name or ID"),
      destination: z.string().describe("Destination location name or ID"),
      preferAccessible: z.boolean().optional().describe("Prefer wheelchair-accessible routes"),
    }),
    execute: async ({ origin, destination, preferAccessible }) => {
      const originLoc = await findLocationByNameOrId(origin);
      const destLoc = await findLocationByNameOrId(destination);
      if (!originLoc) return { error: `Location not found: ${origin}` };
      if (!destLoc) return { error: `Location not found: ${destination}` };

      const allPaths = await prisma.path.findMany({
        where: { status: PathStatus.OPEN },
        include: {
          source: { select: { id: true, name: true, building: { select: { name: true } } } },
          destination: { select: { id: true, name: true, building: { select: { name: true } } } },
        },
      });

      const adj = new Map<string, { to: string; dist: number }[]>();
      for (const p of allPaths) {
        if (preferAccessible && !p.isAccessible) continue;
        if (preferAccessible && p.hasStairs && !p.hasElevator) continue;
        if (!adj.has(p.sourceId)) adj.set(p.sourceId, []);
        adj.get(p.sourceId)!.push({ to: p.destinationId, dist: p.distanceMeters });
        if (p.isBidirectional) {
          if (!adj.has(p.destinationId)) adj.set(p.destinationId, []);
          adj.get(p.destinationId)!.push({ to: p.sourceId, dist: p.distanceMeters });
        }
      }

      const dist = new Map<string, number>();
      const prev = new Map<string, string | null>();
      const visited = new Set<string>();
      const queue: { id: string; d: number }[] = [{ id: originLoc.id, d: 0 }];
      dist.set(originLoc.id, 0);
      prev.set(originLoc.id, null);

      while (queue.length > 0) {
        queue.sort((a, b) => a.d - b.d);
        const cur = queue.shift()!;
        if (visited.has(cur.id)) continue;
        visited.add(cur.id);
        for (const nb of adj.get(cur.id) || []) {
          if (visited.has(nb.to)) continue;
          const nd = cur.d + nb.dist;
          const ed = dist.get(nb.to);
          if (ed === undefined || nd < ed) {
            dist.set(nb.to, nd);
            prev.set(nb.to, cur.id);
            queue.push({ id: nb.to, d: nd });
          }
        }
      }

      const totalDist = dist.get(destLoc.id);
      if (totalDist === undefined) {
        return { error: "No route found.", origin: originLoc.name, destination: destLoc.name };
      }

      const path: string[] = [];
      let cur: string | null = destLoc.id;
      while (cur) {
        const node = await prisma.location.findUnique({ where: { id: cur }, select: { name: true, building: { select: { name: true } } } });
        if (node) path.unshift(`${node.name} (${node.building.name})`);
        cur = prev.get(cur) ?? null;
      }

      return {
        origin: originLoc.name,
        destination: destLoc.name,
        totalDistanceMeters: Math.round(totalDist),
        estimatedWalkingTimeMinutes: Math.ceil((totalDist / 5000) * 60),
        steps: path,
      };
    },
  }),

  getNearbyFacilities: tool({
    description: "Find facilities near a given location.",
    parameters: z.object({
      location: z.string().describe("Reference location name or ID"),
      category: z.enum(["CANTEEN", "WASHROOM", "PARKING", "MEDICAL", "LIBRARY", "STORE"]).optional(),
      radiusMeters: z.number().optional().default(200),
    }),
    execute: async ({ location, category, radiusMeters }) => {
      const ref = await findLocationByNameOrId(location);
      if (!ref) return { error: `Location not found: ${location}` };

      const allLocs = await prisma.location.findMany({
        where: {
          id: { not: ref.id },
          latitude: { not: null },
          longitude: { not: null },
          ...(category ? { category: category as LocationCategory } : {}),
        },
        include: { building: { select: { name: true } } },
      });

      const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371000;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };

      return allLocs
        .map((l) => ({ name: l.name, category: l.category, building: l.building.name, distanceMeters: Math.round(haversine(ref.latitude!, ref.longitude!, l.latitude!, l.longitude!)) }))
        .filter((l) => l.distanceMeters <= radiusMeters)
        .sort((a, b) => a.distanceMeters - b.distanceMeters)
        .slice(0, 10);
    },
  }),

  getLocationDetails: tool({
    description: "Get detailed information about a specific location.",
    parameters: z.object({
      locationId: z.string().describe("Location ID, code, or name"),
    }),
    execute: async ({ locationId }) => {
      const loc = await prisma.location.findFirst({
        where: {
          OR: [
            { id: locationId },
            { code: { equals: locationId, mode: "insensitive" } },
            { name: { contains: locationId, mode: "insensitive" } },
          ],
        },
        include: {
          building: { select: { name: true, code: true } },
          pathsFrom: { where: { status: PathStatus.OPEN }, select: { destination: { select: { name: true, building: { select: { name: true } } } }, distanceMeters: true } },
          pathsTo: { where: { status: PathStatus.OPEN }, select: { source: { select: { name: true, building: { select: { name: true } } } }, distanceMeters: true } },
        },
      });
      if (!loc) return { error: `Location not found: ${locationId}` };

      return {
        name: loc.name,
        code: loc.code,
        category: loc.category,
        floor: loc.floor,
        building: loc.building.name,
        description: loc.description,
        accessibility: { isAccessible: loc.isAccessible, hasStairs: loc.hasStairs, hasElevator: loc.hasElevator },
        connections: [
          ...loc.pathsFrom.map((p) => ({ to: p.destination.name, building: p.destination.building.name, distance: Math.round(p.distanceMeters) })),
          ...loc.pathsTo.map((p) => ({ to: p.source.name, building: p.source.building.name, distance: Math.round(p.distanceMeters) })),
        ],
      };
    },
  }),

  checkPathStatus: tool({
    description: "Check if a pathway between two locations is open, blocked, or under construction.",
    parameters: z.object({
      sourceId: z.string().describe("Source location ID or name"),
      destinationId: z.string().describe("Destination location ID or name"),
    }),
    execute: async ({ sourceId, destinationId }) => {
      const src = await findLocationByNameOrId(sourceId);
      const dst = await findLocationByNameOrId(destinationId);
      if (!src) return { error: `Source not found: ${sourceId}` };
      if (!dst) return { error: `Destination not found: ${destinationId}` };

      const path = await prisma.path.findFirst({
        where: { OR: [{ sourceId: src.id, destinationId: dst.id }, { sourceId: dst.id, destinationId: src.id }] },
        include: { blockedPeriods: { where: { isActive: true } } },
      });

      if (!path) return { exists: false, message: "No direct path found." };

      return {
        exists: true,
        status: path.status,
        isOpen: path.status === PathStatus.OPEN,
        distanceMeters: Math.round(path.distanceMeters),
        blockedReasons: path.blockedPeriods.map((bp) => bp.reason),
      };
    },
  }),

  getFloorInfo: tool({
    description: "Get information about what's on a specific floor of a building.",
    parameters: z.object({
      buildingCode: z.string().describe("Building code"),
      floor: z.enum(["BASEMENT", "GROUND", "FIRST", "SECOND"]).describe("Floor level"),
    }),
    execute: async ({ buildingCode, floor }) => {
      const building = await prisma.building.findFirst({ where: { code: { equals: buildingCode, mode: "insensitive" } } });
      if (!building) return { error: `Building not found: ${buildingCode}` };

      const locations = await prisma.location.findMany({
        where: { buildingId: building.id, floor: floor as Floor },
        orderBy: { name: "asc" },
      });

      const cats: Record<string, number> = {};
      for (const l of locations) cats[l.category] = (cats[l.category] || 0) + 1;

      return {
        building: building.name,
        floor,
        totalLocations: locations.length,
        categories: cats,
        locations: locations.map((l) => ({ name: l.name, code: l.code, category: l.category, description: l.description })),
      };
    },
  }),
};

export interface StreamContext {
  userId?: string;
  currentLocation?: { lat: number; lng: number };
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

export async function* streamCampusAI(
  userMessage: string,
  context?: StreamContext
): AsyncGenerator<string, void, unknown> {
  const systemPrompt = getSystemPrompt(context);

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  if (context?.conversationHistory) {
    for (const msg of context.conversationHistory.slice(-10)) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({ role: "user", content: userMessage });

  let result: any;
  try {
    result = await streamText({
      model: openai("gpt-4o-mini"),
      messages,
      tools: campusTools,
      maxSteps: 5,
      toolChoice: "auto",
      onFinish: () => {},
    });
  } catch (error) {
    const fallback = getOfflineResponse(userMessage);
    yield fallback.text;
    return;
  }

  const textStream = result.textStream;
  for await (const chunk of textStream) {
    yield chunk;
  }

  const finalResponse = await result.response;
  if (finalResponse?.messages) {
    for (const msg of finalResponse.messages) {
      if (msg.role === "assistant" && Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part.type === "tool-result" && part.result) {
            yield `\n\n`;
          }
        }
      }
    }
  }
}

export async function getCampusAIResponse(
  userMessage: string,
  context?: StreamContext
): Promise<{ text: string; sources: string[] }> {
  try {
    let fullText = "";
    for await (const chunk of streamCampusAI(userMessage, context)) {
      fullText += chunk;
    }
    return { text: fullText, sources: ["ai-api"] };
  } catch {
    const fallback = getOfflineResponse(userMessage);
    return { text: fallback.text, sources: ["fallback-offline"] };
  }
}
