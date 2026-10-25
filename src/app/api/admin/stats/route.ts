import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [totalLocations, totalPaths, totalUsers, blockedPaths, totalReports, totalSessions] = await Promise.all([
      prisma.location.count(),
      prisma.path.count(),
      prisma.user.count(),
      prisma.path.count({ where: { status: 'BLOCKED' } }),
      prisma.userReport.count(),
      prisma.navigationSession.count(),
    ]);

    return NextResponse.json({
      stats: { totalLocations, totalPaths, totalUsers, blockedPaths, totalReports, totalSessions },
    });
  } catch (error) {
    return NextResponse.json({
      stats: { totalLocations: 0, totalPaths: 0, totalUsers: 0, blockedPaths: 0, totalReports: 0, totalSessions: 0 },
    });
  }
}