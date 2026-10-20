'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/services/api';

type Branch = { _id: string; slug: string; name: string; address: string };

export default function BranchSelectionPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get('/branches').then((res) => setBranches(res.data.data ?? [])).catch(() => setError(true));
  }, []);

  return <main className="mx-auto max-w-xl px-5 py-12">
    <h1 className="font-heading text-3xl text-primary">Elegí tu sucursal</h1>
    <p className="mt-2 text-white/70">El menú, los precios y el envío se calculan para la sucursal que elijas.</p>
    {error && <p className="mt-6 text-red-400">No se pudieron cargar las sucursales.</p>}
    <div className="mt-8 grid gap-3">
      {branches.map((branch) => <Link key={branch._id} href={`/s/${branch.slug}`}
        className="rounded-xl border border-white/15 bg-white/5 p-5 hover:border-primary/60">
        <strong className="block text-lg">{branch.name}</strong>
        <span className="text-sm text-white/60">{branch.address}</span>
      </Link>)}
    </div>
  </main>;
}
