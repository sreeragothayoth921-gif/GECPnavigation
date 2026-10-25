import { prisma } from "./prisma";
import { LocationCategory, Floor, ReportStatus, Prisma } from "@prisma/client";

export async function getAllBuildings() {
  return prisma.building.findMany({
    include: {
      locations: {
        select: { id: true, name: true, category: true, floor: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getBuildingById(id: string) {
  return prisma.building.findUnique({
    where: { id },
    include: {
      locations: {
        include: {
          pathsFrom: { select: { id: true } },
          pathsTo: { select: { id: true } },
        },
      },
    },
  });
}

export async function getAllLocations(filters?: {
  category?: LocationCategory;
  buildingId?: string;
  floor?: Floor;
}) {
  const where: Prisma.LocationWhereInput = {};

  if (filters?.category) where.category = filters.category;
  if (filters?.buildingId) where.buildingId = filters.buildingId;
  if (filters?.floor) where.floor = filters.floor;

  return prisma.location.findMany({
    where,
    include: { building: { select: { id: true, code: true, name: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getLocationById(id: string) {
  return prisma.location.findUnique({
    where: { id },
    include: {
      building: true,
      pathsFrom: {
        include: {
          destination: {
            select: {
              id: true,
              name: true,
              category: true,
              floor: true,
              building: { select: { id: true, code: true, name: true } },
            },
          },
        },
      },
      pathsTo: {
        include: {
          source: {
            select: {
              id: true,
              name: true,
              category: true,
              floor: true,
              building: { select: { id: true, code: true, name: true } },
            },
          },
        },
      },
      savedBy: { select: { id: true, label: true } },
    },
  });
}

export async function searchLocations(
  query: string,
  category?: LocationCategory,
  buildingId?: string,
  floor?: Floor
) {
  const where: Prisma.LocationWhereInput = {
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { shortName: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { code: { contains: query, mode: "insensitive" } },
    ],
  };

  if (category) where.category = category;
  if (buildingId) where.buildingId = buildingId;
  if (floor) where.floor = floor;

  return prisma.location.findMany({
    where,
    include: { building: { select: { id: true, code: true, name: true } } },
    orderBy: { name: "asc" },
    take: 50,
  });
}

export async function getLocationsByBuildingAndFloor(
  buildingId: string,
  floor: Floor
) {
  return prisma.location.findMany({
    where: { buildingId, floor },
    include: {
      pathsFrom: {
        where: { status: "OPEN" },
        select: { id: true, destinationId: true, distanceMeters: true },
      },
      pathsTo: {
        where: { status: "OPEN" },
        select: { id: true, sourceId: true, distanceMeters: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getAllPaths() {
  return prisma.path.findMany({
    include: {
      source: {
        select: {
          id: true,
          name: true,
          category: true,
          floor: true,
          building: { select: { id: true, code: true, name: true } },
        },
      },
      destination: {
        select: {
          id: true,
          name: true,
          category: true,
          floor: true,
          building: { select: { id: true, code: true, name: true } },
        },
      },
      blockedPeriods: { where: { isActive: true } },
    },
  });
}

export async function getPathsByLocation(locationId: string) {
  return prisma.path.findMany({
    where: {
      OR: [{ sourceId: locationId }, { destinationId: locationId }],
    },
    include: {
      source: {
        select: { id: true, name: true, category: true, floor: true },
      },
      destination: {
        select: { id: true, name: true, category: true, floor: true },
      },
      blockedPeriods: { where: { isActive: true } },
    },
  });
}

export async function getBlockedPaths() {
  return prisma.blockedPath.findMany({
    where: { isActive: true },
    include: {
      path: {
        include: {
          source: { select: { id: true, name: true } },
          destination: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
      role: true,
      navigationPrefs: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
}

export async function getUserSavedPlaces(userId: string) {
  return prisma.savedPlace.findMany({
    where: { userId },
    include: {
      location: {
        include: {
          building: { select: { id: true, code: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getNavigationHistory(userId: string, limit = 20) {
  return prisma.navigationSession.findMany({
    where: { userId },
    include: {
      startLocation: {
        select: { id: true, name: true, category: true },
      },
      endLocation: {
        select: { id: true, name: true, category: true },
      },
    },
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}

export async function getReports(status?: ReportStatus) {
  const where: Prisma.UserReportWhereInput = {};
  if (status) where.status = status;

  return prisma.userReport.findMany({
    where,
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      location: { select: { id: true, name: true } },
      path: {
        select: {
          id: true,
          source: { select: { name: true } },
          destination: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminStats() {
  const [
    totalUsers,
    totalLocations,
    totalBuildings,
    totalPaths,
    blockedPaths,
    pendingReports,
    totalNavigations,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.location.count(),
    prisma.building.count(),
    prisma.path.count(),
    prisma.path.count({ where: { status: "BLOCKED" } }),
    prisma.userReport.count({ where: { status: "PENDING" } }),
    prisma.navigationSession.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    totalUsers,
    totalLocations,
    totalBuildings,
    totalPaths,
    blockedPaths,
    pendingReports,
    totalNavigations,
    recentUsers,
  };
}

export async function getNearbyLocations(
  lat: number,
  lng: number,
  radiusMeters: number,
  category?: LocationCategory
) {
  const where: Prisma.LocationWhereInput = {
    latitude: { not: null },
    longitude: { not: null },
  };

  if (category) where.category = category;

  const allLocations = await prisma.location.findMany({
    where,
    include: { building: { select: { id: true, code: true, name: true } } },
  });

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const haversineDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371000;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  return allLocations
    .map((loc) => ({
      ...loc,
      distanceMeters: haversineDistance(lat, lng, loc.latitude!, loc.longitude!),
    }))
    .filter((loc) => loc.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}
