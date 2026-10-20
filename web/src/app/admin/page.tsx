'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

export default function AdminRedirectPage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const branch = useAuthStore((s) => s.branch);
  useEffect(() => {
    if (role === 'owner') router.replace('/owner');
    else if (branch?.slug) router.replace(`/admin/s/${branch.slug}`);
    else router.replace('/login');
  }, [role, branch?.slug, router]);
  return null;
}
