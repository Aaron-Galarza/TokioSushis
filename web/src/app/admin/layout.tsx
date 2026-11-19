import { redirect } from 'next/navigation';
import { adminToken, isAdminSessionValid } from '@/lib/admin-session';
import { AdminShell } from './AdminShell';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!await isAdminSessionValid(await adminToken())) {
    redirect('/login');
  }
  return <AdminShell>{children}</AdminShell>;
}
