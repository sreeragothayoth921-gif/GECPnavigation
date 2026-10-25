import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/database/prisma';

const SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me');
const COOKIE_NAME = 'campusnav-session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Parse cookie from header directly (most reliable)
    let token: string | undefined;

    const cookieHeader = req.headers.get('cookie') || '';
    for (const part of cookieHeader.split(';')) {
      const [name, ...rest] = part.trim().split('=');
      if (name === COOKIE_NAME) {
        token = rest.join('=');
        break;
      }
    }

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated', debug: { cookieHeader: cookieHeader.substring(0, 100) } }, { status: 401 });
    }

    let payload;
    try {
      const verified = await jwtVerify(token, SECRET);
      payload = verified.payload as unknown as { id: string; email: string; role: string };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'unknown';
      return NextResponse.json({ error: 'Invalid session', debug: { message: msg } }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, fullName: true, avatarUrl: true, role: true, navigationPrefs: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    return NextResponse.json({ error: 'Internal server error', debug: { message: msg } }, { status: 500 });
  }
}
