import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, ADMIN_COOKIE_OPTIONS } from '@/lib/admin-session';

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Solicitud no permitida' }, { status: 403 });
  }
  const response = NextResponse.json({ authenticated: false }, { headers: { 'Cache-Control': 'no-store' } });
  response.cookies.set(ADMIN_COOKIE, '', { ...ADMIN_COOKIE_OPTIONS, maxAge: 0 });
  return response;
}
