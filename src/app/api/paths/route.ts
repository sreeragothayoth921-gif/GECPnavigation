import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const where: any = {};
    if (status) where.status = status;

    const paths = await prisma.path.findMany({
      where,
      include: { source: { select: { name: true, code: true } }, destination: { select: { name: true, code: true } } },
      orderBy: { distanceMeters: 'asc' },
    });
    return NextResponse.json({ paths });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch paths' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    body.walkingTimeSec = Math.round(body.distanceMeters / ((body.walkingSpeedKmh || 5) * 1000 / 3600));
    const path = await prisma.path.create({ data: body });
    return NextResponse.json({ path }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create path' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();
    if (data.distanceMeters) {
      data.walkingTimeSec = Math.round(data.distanceMeters / (5 * 1000 / 3600));
    }
    const path = await prisma.path.update({ where: { id }, data });
    return NextResponse.json({ path });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update path' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await prisma.path.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete path' }, { status: 500 });
  }
}