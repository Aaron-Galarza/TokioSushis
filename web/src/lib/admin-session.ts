import { cookies } from 'next/headers';

export const ADMIN_COOKIE = process.env.NODE_ENV === 'production'
  ? '__Host-tokyo-admin'
  : 'tokyo-admin-dev';

export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 4 * 60 * 60,
};

export function apiBaseUrl(): string {
  return (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');
}

export async function adminToken(): Promise<string | undefined> {
  return (await cookies()).get(ADMIN_COOKIE)?.value;
}

export async function isAdminSessionValid(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const response = await fetch(`${apiBaseUrl()}/users/session`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
