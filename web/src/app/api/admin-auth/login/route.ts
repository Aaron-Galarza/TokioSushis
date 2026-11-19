import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, ADMIN_COOKIE_OPTIONS, apiBaseUrl } from '@/lib/admin-session';

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Solicitud no permitida' }, { status: 403 });
  }

  let credentials: { email?: unknown; password?: unknown };
  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const { email, password } = credentials;
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password || email.length > 254 || password.length > 1024) {
    return NextResponse.json({ error: 'Ingresá email y contraseña válidos' }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${apiBaseUrl()}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });

    if (!upstream.ok) {
      const isLimited = upstream.status === 429;
      return NextResponse.json(
        { error: isLimited ? 'Demasiados intentos. Intentá de nuevo más tarde.' : 'Credenciales inválidas' },
        { status: isLimited ? 429 : upstream.status === 401 ? 401 : 502 }
      );
    }

    const payload = await upstream.json();
    const token = payload?.data?.token;
    if (typeof token !== 'string' || !token) {
      return NextResponse.json({ error: 'No se pudo iniciar sesión' }, { status: 502 });
    }

    const response = NextResponse.json({ authenticated: true }, { headers: { 'Cache-Control': 'no-store' } });
    response.cookies.set(ADMIN_COOKIE, token, ADMIN_COOKIE_OPTIONS);
    return response;
  } catch {
    return NextResponse.json({ error: 'No se pudo conectar con el servidor' }, { status: 502 });
  }
}
