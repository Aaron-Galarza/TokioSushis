import { Minus, Plus } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import type { Addon } from '@/types';

interface Props {
  availableAddons: Addon[];
  showAllAddons: boolean;
  onToggleShowAll: () => void;
  getAddonQty: (id: string) => number;
  onAddonChange: (addon: Addon, delta: number) => void;
}

export function CartItemExtrasPanel({ availableAddons, showAllAddons, onToggleShowAll, getAddonQty, onAddonChange }: Props) {
  const visible = showAllAddons ? availableAddons : availableAddons.slice(0, 3);

  return (
    <div className="mt-3 border-t border-white/10 pt-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="space-y-2">
        {visible.map((addon: Addon) => (
          <div key={addon.id} className="flex items-center justify-between bg-black/20 p-2 rounded-lg border border-white/5">
            <div>
              <p className="text-sm font-medium text-white/90">{addon.name}</p>
              <p className="text-xs font-bold text-primary">+{formatPrice(addon.price)}</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-black/40 px-2 py-1">
              <button onClick={e => { e.preventDefault(); e.stopPropagation(); onAddonChange(addon, -1); }} className="p-1 text-white/50 hover:text-white transition-colors">
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-4 text-center text-xs font-bold text-white">{getAddonQty(addon.id)}</span>
              <button onClick={e => { e.preventDefault(); e.stopPropagation(); onAddonChange(addon, 1); }} className="p-1 text-white/50 hover:text-white transition-colors">
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {availableAddons.length > 3 && (
        <button onClick={onToggleShowAll} className="mt-3 w-full text-center text-xs font-bold text-primary hover:text-primary/80 transition-colors">
          {showAllAddons ? 'Ver menos opciones' : `Ver ${availableAddons.length - 3} opciones más`}
        </button>
      )}
    </div>
  );
}
