import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, ADMIN_COOKIE_OPTIONS, adminToken, apiBaseUrl } from '@/lib/admin-session';

const ALLOWED_MODULES = new Set([
  'products', 'categories', 'addons', 'orders', 'analytics',
  'coupons', 'gallery', 'config', 'delivery',
]);
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

type Context = { params: Promise<{ path: string[] }> };

async function forward(request: NextRequest, context: Context): Promise<NextResponse> {
  const token = await adminToken();
  if (!token) {
    return NextResponse.json({ error: 'Sesión requerida' }, { status: 401 });
  }

  const { path } = await context.params;
  if (!path?.length || !ALLOWED_MODULES.has(path[0]) || path.some(segment => !/^[a-zA-Z0-9_-]+$/.test(segment))) {
    return NextResponse.json({ error: 'Ruta no permitida' }, { status: 404 });
  }
  if (MUTATING_METHODS.has(request.method) && request.headers.get('origin') !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Solicitud no permitida' }, { status: 403 });
  }

  const target = `${apiBaseUrl()}/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`;
  const contentType = request.headers.get('content-type');
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (contentType) headers['Content-Type'] = contentType;

  try {
    const body = MUTATING_METHODS.has(request.method) ? await request.arrayBuffer() : undefined;
    if (body && body.byteLength > 6 * 1024 * 1024) {
      return NextResponse.json({ error: 'Archivo demasiado grande' }, { status: 413 });
    }
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(30000),
    });
    const response = new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'application/json',
        'Cache-Control': 'no-store',
      },
    });
    if (upstream.status === 401 || upstream.status === 403) {
      response.cookies.set(ADMIN_COOKIE, '', { ...ADMIN_COOKIE_OPTIONS, maxAge: 0 });
    }
    return response;
  } catch {
    return NextResponse.json({ error: 'No se pudo conectar con el servidor' }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
