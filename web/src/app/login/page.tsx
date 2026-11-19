import { redirect } from 'next/navigation';
import { adminToken, isAdminSessionValid } from '@/lib/admin-session';
import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await isAdminSessionValid(await adminToken())) {
    redirect('/admin');
  }
  return <LoginForm />;
}
