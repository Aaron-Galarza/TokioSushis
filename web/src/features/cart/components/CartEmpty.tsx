import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export function CartEmpty() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-900/70 p-7 text-center shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <ShoppingBag className="h-8 w-8 text-white/70" strokeWidth={1.7} />
        </div>

        <h2 className="font-['Bebas_Neue'] text-3xl tracking-wide text-white">Carrito vacio</h2>
        <p className="mt-2 text-sm text-white/60">
          Agrega productos desde el menu para empezar tu pedido.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-white transition hover:bg-primary/90"
        >
          Ver menu
        </Link>
      </div>
    </div>
  );
}
