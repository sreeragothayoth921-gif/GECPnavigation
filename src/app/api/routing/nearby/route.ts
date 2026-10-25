import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get('locationId');
    const category = searchParams.get('category');
    const radiusMeters = parseInt(searchParams.get('radius') || '500');

    if (!locationId) {
      return NextResponse.json({ error: 'locationId is required' }, { status: 400 });
    }

    const location = await prisma.location.findUnique({ where: { id: locationId } });
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Find nearby locations using raw distance calculation
    let query = `
      SELECT l.*, b.name as building_name, b.code as building_code,
        (6371000 * acos(cos(radians($1)) * cos(radians(l.latitude)) * cos(radians(l.longitude) - radians($2)) + sin(radians($1)) * sin(radians(l.latitude)))) as distance
      FROM locations l
      JOIN buildings b ON l.building_id = b.id
      WHERE l.id != $3
        AND l.status = 'active'
        AND l.latitude IS NOT NULL
        AND l.longitude IS NOT NULL
    `;
    const params: any[] = [location.latitude, location.longitude, locationId];

    if (category) {
      query += ` AND l.category = $${params.length + 1}`;
      params.push(category);
    }

    query += ` HAVING (6371000 * acos(cos(radians($1)) * cos(radians(l.latitude)) * cos(radians(l.longitude) - radians($2)) + sin(radians($1)) * sin(radians(l.latitude)))) < $${params.length + 1}`;
    params.push(radiusMeters);

    query += ` ORDER BY distance ASC LIMIT 10`;

    const nearby = await prisma.$queryRawUnsafe(query, ...params);

    return NextResponse.json({ nearby });
  } catch (error) {
    console.error('Nearby error:', error);
    return NextResponse.json({ error: 'Failed to find nearby locations' }, { status: 500 });
  }
}