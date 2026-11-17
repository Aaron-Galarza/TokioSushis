'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, MapPin, Navigation, RefreshCw } from 'lucide-react';
import api from '@/services/api';

type Branch = { _id: string; slug: string; name: string; address: string };

const mediaStyles = [
  'from-[#332818] via-[#16130e] to-[#090909]',
  'from-[#272520] via-[#171713] to-[#090909]',
  'from-[#30251c] via-[#18130f] to-[#090909]',
];

export default function BranchSelectionPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refreshKey, setRefreshKey] = useState(0);

  const retry = useCallback(() => { setStatus('loading'); setRefreshKey((value) => value + 1); }, []);

  useEffect(() => {
    let active = true;
    api.get('/branches')
      .then((res) => {
        if (!active) return;
        setBranches(Array.isArray(res.data?.data) ? res.data.data : []);
        setStatus('ready');
      })
      .catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [refreshKey]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#080807] text-white">
      <section className="relative overflow-hidden border-b border-white/10 px-5 pb-16 pt-16 sm:pb-20 sm:pt-20 lg:pt-24" aria-labelledby="selection-title">
        <div className="pointer-events-none absolute -right-32 -top-48 h-[30rem] w-[30rem] rounded-full bg-primary/[0.07] blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl">
          <p className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            <span className="h-px w-8 bg-primary" aria-hidden="true" /> Tokyo Sushis · Nuestros locales
          </p>
          <h1 id="selection-title" className="max-w-4xl font-heading text-[clamp(2.8rem,7vw,5.6rem)] font-semibold leading-[1.02] tracking-[-0.055em]">
            Tu sushi, <span className="text-primary">más cerca.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
            Elegí el local desde el que querés pedir. Vas a ver su menú, precios y opciones de entrega.
          </p>
          <a href="#locales" className="mt-8 inline-flex min-h-12 items-center gap-3 border-b border-primary pb-1 text-sm font-bold uppercase tracking-[0.14em] text-primary transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
            Explorar locales <ArrowRight size={18} aria-hidden="true" />
          </a>
        </div>
      </section>

      <section id="locales" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14 sm:py-20" aria-labelledby="locales-title">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Encontrá tu lugar</p>
            <h2 id="locales-title" className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Nuestros locales</h2>
          </div>
          {status === 'ready' && branches.length > 0 && <p className="text-sm text-white/50">{branches.length} {branches.length === 1 ? 'local disponible' : 'locales disponibles'}</p>}
        </div>

        {status === 'loading' && <div className="space-y-4" aria-label="Cargando sucursales" aria-busy="true">
          {[0, 1, 2].map((item) => <div key={item} className="h-56 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04] motion-reduce:animate-none sm:h-48" />)}
        </div>}

        {status === 'error' && <div role="alert" className="rounded-2xl border border-primary/25 bg-primary/[0.06] p-8 text-center">
          <h3 className="font-heading text-xl">No pudimos cargar los locales</h3>
          <p className="mt-2 text-sm text-white/60">Revisá tu conexión e intentá nuevamente.</p>
          <button type="button" onClick={retry} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 font-semibold text-black transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <RefreshCw size={17} aria-hidden="true" /> Reintentar
          </button>
        </div>}

        {status === 'ready' && branches.length === 0 && <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-white/65">
          No hay locales disponibles en este momento.
        </div>}

        {status === 'ready' && branches.length > 0 && <div className="space-y-4 sm:space-y-5">
          {branches.map((branch, index) => <article key={branch._id} className="grid overflow-hidden rounded-2xl border border-white/10 bg-[#11110f] transition-colors hover:border-primary/50 md:grid-cols-[minmax(210px,32%)_1fr]">
            <div className={`relative flex min-h-48 items-center justify-center overflow-hidden bg-gradient-to-br ${mediaStyles[index % mediaStyles.length]} md:min-h-56`} aria-hidden="true">
              <div className="absolute -left-16 -top-24 h-72 w-72 rounded-full border border-primary/15" />
              <div className="absolute -left-5 -top-14 h-60 w-60 rounded-full border border-primary/15" />
              <div className="absolute -left-1 -top-8 h-48 w-48 rounded-full border border-primary/15" />
              <span className="absolute left-5 top-5 text-xs font-semibold tracking-[0.22em] text-primary/75">LOCAL {String(index + 1).padStart(2, '0')}</span>
              <Image src="/tokyoSushis.webp" alt="" width={112} height={112} className="relative h-24 w-24 object-contain opacity-90 drop-shadow-[0_12px_24px_rgba(0,0,0,0.65)] sm:h-28 sm:w-28" />
              <span className="absolute bottom-5 right-5 font-heading text-5xl font-semibold leading-none text-white/[0.08]">{String(index + 1).padStart(2, '0')}</span>
            </div>
            <div className="flex flex-col justify-between gap-7 p-6 sm:p-8 lg:flex-row lg:items-center lg:gap-8">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Tokyo Sushis / Local {String(index + 1).padStart(2, '0')}</p>
                <h3 className="mt-2 font-heading text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{branch.name}</h3>
                <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-white/60"><MapPin size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />{branch.address}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
                <Link href={`/s/${branch.slug}`} className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-primary px-6 text-sm font-bold text-black transition-colors hover:bg-[#e2cb9a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  Ver menú <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${branch.name}, ${branch.address}`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/20 px-5 text-sm font-medium text-white/75 transition-colors hover:border-white/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" aria-label={`Cómo llegar a ${branch.name} (abre Google Maps)`}>
                  <Navigation size={16} aria-hidden="true" /> Cómo llegar
                </a>
              </div>
            </div>
          </article>)}
        </div>}
      </section>
    </div>
  );
}
