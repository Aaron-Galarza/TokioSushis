"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
import { useCartStore } from "@/stores/cart.store";
import { CartItemCard } from "@/features/cart/components/CartItemcard";
import { CartEmpty } from "@/features/cart/components/CartEmpty";

export default function CartPage() {
  const { items, getTotals, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col pt-6">
        <header className="w-full p-4">
          <Link
            href="/"
            className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 text-white/70 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </header>
        <CartEmpty />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      
      {/* 👇 CAMBIO CLAVE: 'sticky top-0'. 
           Esto lo clava arriba al hacer scroll, pero respeta el espacio de los productos */}
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-xl border-b border-white/10 shadow-sm">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/90"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-heading text-2xl tracking-wide text-white mt-1">TU PEDIDO</h1>
          </div>

          <div className="flex items-center gap-1.5 bg-primary/20 px-3 py-1.5 rounded-full border border-primary/30">
            <ShoppingBag className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold text-primary">
              {items.length} {items.length === 1 ? "ítem" : "ítems"}
            </span>
          </div>
        </div>
      </header>

      {/* 👇 Volvemos a un padding normal (pt-5) porque el sticky ya no se come el espacio */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-3 sm:px-4 pt-5 pb-8 flex flex-col gap-5 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider">Productos seleccionados</h2>
            <button
              onClick={clearCart}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/35 bg-red-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors"
              aria-label="Vaciar carrito"
            >
              <Trash2 className="w-3 h-3" />
              Vaciar
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
           <CartItemCard
  key={`${item.product.id}-${index}`}
  item={item}
  index={index}
/>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 shadow-md backdrop-blur mt-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col pl-1">
              <span className="text-xs text-white/50 font-semibold uppercase tracking-wider">Total Final</span>
              <span className="font-black text-2xl text-white leading-none">
                ${getTotals().total.toLocaleString("es-AR")}
              </span>
            </div>

            <Link
              href="/checkout"
              className="flex-1 bg-primary text-white font-extrabold text-base sm:text-lg py-3.5 px-5 rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              Continuar
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}