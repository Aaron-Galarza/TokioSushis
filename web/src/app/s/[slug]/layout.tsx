'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import { useCartStore } from '@/stores/cart.store';

export default function BranchLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError(false);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setError(true);
      return;
    }
    api.get(`/branches/${slug}`).then(() => {
      if (cancelled) return;
      useCartStore.getState().switchBranch(slug);
      setReady(true);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [slug]);

  if (error) return <main className="mx-auto max-w-xl p-8 text-center"><h1>Sucursal no disponible</h1><Link href="/">Elegir otra sucursal</Link></main>;
  if (!ready) return <main className="mx-auto max-w-xl p-8 text-center">Cargando sucursal...</main>;
  return <>{children}</>;
}
