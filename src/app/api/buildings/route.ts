import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET() {
  try {
    const buildings = await prisma.building.findMany({
      include: { _count: { select: { locations: true } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ buildings });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch buildings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const building = await prisma.building.create({ data: body });
    return NextResponse.json({ building }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create building' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();
    const building = await prisma.building.update({ where: { id }, data });
    return NextResponse.json({ building });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update building' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await prisma.building.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete building' }, { status: 500 });
  }
}