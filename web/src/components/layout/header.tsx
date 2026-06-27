'use client';

import { ShoppingCart, Lock } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart.store';

const emptySubscribe = () => () => {};

export function Header() {
  const router = useRouter();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const cartCount = useCartStore((state) => state.getTotals().itemCount);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">

        {/* Izquierda: Admin */}
        <button
          onClick={() => router.push('/admin')}
          className="flex rounded-lg border border-white/10 bg-white/5 p-2 text-primary transition-all hover:bg-white/10 active:scale-95"
          aria-label="Ir al panel admin"
        >
          <Lock size={18} strokeWidth={2} />
        </button>

        {/* Centro: Logo + texto */}
        <button
          onClick={() => router.push('/')}
          className="group flex flex-1 items-center justify-center gap-2.5 px-4 transition-opacity hover:opacity-80"
          aria-label="Ir al inicio"
        >
          <img
            src="/tokyoSushis.webp"
            alt="Tokio Sushis"
            width={32}
            height={32}
            className="h-8 w-auto object-contain"
          />
          <span className="font-heading italic text-xl font-semibold tracking-widest text-primary">
            TOKIO SUSHIS
          </span>
        </button>

        {/* Derecha: Carrito */}
        <button
          onClick={() => router.push('/cart')}
          className="relative flex rounded-lg border border-white/10 bg-white/5 p-2 text-white transition-all hover:bg-white/10 active:scale-95"
          aria-label="Abrir carrito"
        >
          <ShoppingCart size={22} strokeWidth={2} />
          {mounted && cartCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-black">
              {cartCount}
            </span>
          )}
        </button>

      </div>
    </header>
  );
}