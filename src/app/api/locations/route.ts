import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const buildingId = searchParams.get('buildingId');
    const floor = searchParams.get('floor');

    const where: any = { status: 'active' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;
    if (buildingId) where.buildingId = buildingId;
    if (floor) where.floor = floor;

    const locations = await prisma.location.findMany({
      where,
      include: { building: { select: { name: true, code: true } } },
      orderBy: [{ buildingId: 'asc' }, { floor: 'asc' }, { name: 'asc' }],
      take: 100,
    });

    return NextResponse.json({ locations });
  } catch (error) {
    console.error('Locations fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const location = await prisma.location.create({ data: body });
    return NextResponse.json({ location }, { status: 201 });
  } catch (error) {
    console.error('Location create error:', error);
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();
    const location = await prisma.location.update({ where: { id }, data });
    return NextResponse.json({ location });
  } catch (error) {
    console.error('Location update error:', error);
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await prisma.location.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Location delete error:', error);
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 });
  }
}