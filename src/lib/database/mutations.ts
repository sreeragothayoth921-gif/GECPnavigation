import { prisma } from "./prisma";
import { Prisma, PathStatus, ReportStatus, UserRole } from "@prisma/client";

export async function createLocation(
  data: Prisma.LocationCreateInput
) {
  return prisma.location.create({ data });
}

export async function updateLocation(
  id: string,
  data: Prisma.LocationUpdateInput
) {
  return prisma.location.update({ where: { id }, data });
}

export async function deleteLocation(id: string) {
  return prisma.location.delete({ where: { id } });
}

export async function createPath(data: Prisma.PathCreateInput) {
  return prisma.path.create({ data });
}

export async function updatePath(
  id: string,
  data: Prisma.PathUpdateInput
) {
  return prisma.path.update({ where: { id }, data });
}

export async function deletePath(id: string) {
  return prisma.path.delete({ where: { id } });
}

export async function blockPath(
  pathId: string,
  reason: string,
  blockedBy: string
) {
  const [blocked, _path] = await prisma.$transaction([
    prisma.blockedPath.create({
      data: { pathId, reason, blockedBy },
    }),
    prisma.path.update({
      where: { id: pathId },
      data: { status: PathStatus.BLOCKED },
    }),
  ]);

  return blocked;
}

export async function unblockPath(pathId: string) {
  const [_, path] = await prisma.$transaction([
    prisma.blockedPath.updateMany({
      where: { pathId, isActive: true },
      data: { isActive: false },
    }),
    prisma.path.update({
      where: { id: pathId },
      data: { status: PathStatus.OPEN },
    }),
  ]);

  return path;
}

export async function createReport(data: Prisma.UserReportCreateInput) {
  return prisma.userReport.create({ data });
}

export async function updateReportStatus(
  id: string,
  status: ReportStatus,
  adminNotes?: string
) {
  return prisma.userReport.update({
    where: { id },
    data: {
      status,
      adminNotes,
      resolvedAt: status === "RESOLVED" || status === "REJECTED"
        ? new Date()
        : undefined,
    },
  });
}

export async function createNavigationSession(
  data: Prisma.NavigationSessionCreateInput
) {
  return prisma.navigationSession.create({ data });
}

export async function completeNavigationSession(
  id: string,
  actualTime?: number
) {
  return prisma.navigationSession.update({
    where: { id },
    data: {
      completedAt: new Date(),
      actualTimeSec: actualTime,
    },
  });
}

export async function toggleSavedPlace(
  userId: string,
  locationId: string,
  label?: string
) {
  const existing = await prisma.savedPlace.findUnique({
    where: { userId_locationId: { userId, locationId } },
  });

  if (existing) {
    await prisma.savedPlace.delete({
      where: { id: existing.id },
    });
    return { saved: false };
  }

  await prisma.savedPlace.create({
    data: { userId, locationId, label },
  });
  return { saved: true };
}

export async function updateUser(
  id: string,
  data: Prisma.UserUpdateInput
) {
  return prisma.user.update({ where: { id }, data });
}

export async function updateUserRole(id: string, role: UserRole) {
  return prisma.user.update({ where: { id }, data: { role } });
}

export async function createAdminLog(data: Prisma.AdminLogCreateInput) {
  return prisma.adminLog.create({ data });
}
