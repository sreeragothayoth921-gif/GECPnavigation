import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const where: any = {};
    if (status) where.status = status;

    const reports = await prisma.userReport.findMany({
      where,
      include: { location: { select: { name: true, code: true } }, user: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const report = await prisma.userReport.create({ data: body });
    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, status, adminNotes } = await req.json();
    const report = await prisma.userReport.update({
      where: { id },
      data: { status, adminNotes, resolvedAt: status === 'RESOLVED' ? new Date() : undefined },
    });
    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}