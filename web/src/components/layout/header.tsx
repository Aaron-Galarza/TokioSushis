'use client';

import { Menu, ShoppingCart } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart.store'; // <-- 1. Importamos tu store

const emptySubscribe = () => () => {};

export function Header() {
  const router = useRouter();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  
  // <-- 2. Consumimos el contador total de ítems en tiempo real
  const cartCount = useCartStore((state) => state.getTotals().itemCount);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-secondary/20 bg-primary/88 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <button
         onClick={() => { /*TODO=> Abrir menú lateral*/ }}
          className="rounded-full border border-secondary/30 bg-white/5 p-2 text-secondary transition-all hover:bg-white/10 active:scale-95"
          aria-label="Abrir menu"
        >
          <Menu size={22} strokeWidth={2.4} />
        </button>

        <button
          onClick={() => router.push('/')}
          className="group flex flex-1 items-center justify-center gap-2 px-2 transition-opacity hover:opacity-90"
          aria-label="Ir al inicio"
        >
          <img
            src="https://res.cloudinary.com/dojwvsefr/image/upload/v1779155504/LOGO-AW_1_s3k9qd.png"
            alt="American Way"
            className="h-8 object-contain transition-transform duration-500 group-hover:scale-105"
          />
          <span className="hidden font-heading text-lg font-bold uppercase tracking-wider text-secondary md:block">
            American Way
          </span>
        </button>

        <button
          onClick={() => router.push('/cart')}
          className="relative rounded-full border border-secondary/30 bg-white/5 p-2 text-secondary transition-all hover:bg-white/10 active:scale-95"
          aria-label="Abrir carrito"
        >
          <ShoppingCart size={22} strokeWidth={2.4} />
          {mounted && cartCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border border-primary bg-secondary px-1 text-[10px] font-black text-primary">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
