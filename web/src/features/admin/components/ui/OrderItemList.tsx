'use client';

interface OrderItemAddon {
  title: string;
  quantity: number;
}

interface OrderItem {
  title: string;
  quantity: number;
  price: number;
  addons?: OrderItemAddon[];
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
                ${(item.price * item.quantity)?.toLocaleString('es-AR')}
              </span>
            </div>
            {item.addons && item.addons.length > 0 && (
              <p className="text-[11px] text-white/30 pl-4 mt-0.5">
                + {item.addons.map((a) => `${a.quantity}x ${a.title}`).join(', ')}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}