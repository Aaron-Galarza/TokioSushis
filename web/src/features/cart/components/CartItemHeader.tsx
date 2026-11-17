import { Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import type { CartAddon } from '@/types';

interface Props {
  title: string;
  price: number;
  imageSrc: string;
  imageError: boolean;
  onImageError: () => void;
  addons: CartAddon[];
  onRemove: () => void;
}

export function CartItemHeader({ title, price, imageSrc, imageError, onImageError, addons, onRemove }: Props) {
  return (
    <div className="flex gap-3">
      <div className="relative shrink-0 w-20 h-20 bg-zinc-950 rounded-xl overflow-hidden border border-white/10 ring-1 ring-white/5">
        {!imageError && imageSrc ? (
          <img src={imageSrc} alt={title} className="h-full w-full object-cover animate-in fade-in duration-500" onError={onImageError} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Sin img</div>
        )}
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-[15px] font-bold text-white leading-tight truncate pr-1">{title}</h3>
          <button onClick={onRemove} className="shrink-0 p-1 text-red-300/70 hover:text-red-200 hover:bg-red-500/15 rounded-md transition-colors" aria-label={`Eliminar ${title} del carrito`}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs font-medium text-white/55 mt-0.5">{formatPrice(price)} c/u</p>

        {addons.length > 0 && (
          <div className="mt-2 space-y-1 bg-white/5 p-2 rounded-lg border border-white/10">
            {addons.map((a, i) => (
              <div key={i} className="text-xs flex justify-between items-center gap-2 text-white/70">
                <span className="truncate"><span className="text-primary font-bold">{a.quantity}x</span> {a.addon.name}</span>
                <span className="shrink-0 font-medium text-white/60">+{formatPrice(a.addon.price * a.quantity)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
