'use client';

interface OrderItemAddon {
  title: string;
  quantity: number;
  price?: number;
}

interface OrderItem {
  title: string;
  quantity: number;
  price: number;
  addons?: OrderItemAddon[];
  ingredientes?: { ingredienteNombre: string; grupoNombre?: string; cantidad: number; precio: number }[];
  precioIngredientes?: number;
}

interface OrderItemListProps {
  items?: OrderItem[];
}

export function OrderItemList({ items }: OrderItemListProps) {
  return (
    <div className="space-y-1">
      {items?.map((item, i) => {
        const totalAddonsQty = item.addons?.reduce((sum, a) => sum + (a.quantity ?? 0), 0) ?? 0;
        return (
          <div key={i} className="text-sm">
            <div className="flex justify-between">
              <span className="text-white">
                <span className="text-primary font-bold">{item.quantity}×</span> {item.title}
                {totalAddonsQty > 0 && (
                  <span className="text-xs bg-[#222] border border-white/10 rounded px-1.5 py-0.5 ml-2 text-white/60">
                    Adic: <span className="text-primary font-bold">{totalAddonsQty}</span>
                  </span>
                )}
              </span>
              <span className="text-white/40 shrink-0 ml-2">
                ${((item.price + (item.precioIngredientes ?? 0) + (item.addons ?? []).reduce((sum, addon) => sum + (addon.price ?? 0) * addon.quantity, 0)) * item.quantity).toLocaleString('es-AR')}
              </span>
            </div>
            {item.addons && item.addons.length > 0 && (
              <p className="text-[11px] text-white/30 pl-4 mt-0.5">
                + {item.addons.map((a) => `${a.quantity}x ${a.title}`).join(', ')}
              </p>
            )}
            {!!item.ingredientes?.length && <p className="mt-0.5 pl-4 text-[11px] text-white/40">{item.ingredientes.map(entry => `${entry.cantidad}× ${entry.ingredienteNombre}`).join(' · ')}</p>}
          </div>
        );
      })}
    </div>
  );
}
