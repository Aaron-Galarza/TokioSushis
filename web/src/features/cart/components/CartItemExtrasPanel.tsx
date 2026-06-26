import { useMemo } from 'react';
import { Minus, Plus } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import type { Addon } from '@/types';

interface Props {
  availableAddons: Addon[];
  getAddonQty: (id: string) => number;
  onAddonChange: (addon: Addon, delta: number) => void;
}

export function CartItemExtrasPanel({ availableAddons, getAddonQty, onAddonChange }: Props) {

  // Agrupa los adicionales por nombre de categoría, resolviendo desde el array populado.
  // Si un adicional tiene categories vacío (aplica a todos) lo ponemos bajo "Adicionales".
  const groupedAddons = useMemo(() => {
    const groups: Record<string, Addon[]> = {};

    availableAddons.forEach((addon) => {
      if (addon.categories && addon.categories.length > 0) {
        // Un adicional puede pertenecer a varias categorías; lo mostramos una sola vez
        // bajo el nombre de la primera categoría activa que tenga.
        const cat = addon.categories.find(c => c.active) ?? addon.categories[0];
        const key = cat.name;
        if (!groups[key]) groups[key] = [];
        groups[key].push(addon);
      } else {
        // Sin categorías asignadas → aplica a todos → grupo genérico
        if (!groups['Adicionales']) groups['Adicionales'] = [];
        groups['Adicionales'].push(addon);
      }
    });

    return groups;
  }, [availableAddons]);

  if (availableAddons.length === 0) return null;

  return (
    <div className="mt-3 border-t border-white/10 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="space-y-4">
        {Object.entries(groupedAddons).map(([category, addons]) => (
          <div key={category} className="space-y-1.5">

            <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/40 pl-1">
              {category}
            </h4>

            <div className="space-y-1.5">
              {addons.map((addon: Addon) => {
                const qty = getAddonQty(addon.id);
                return (
                  <div
                    key={addon.id}
                    className="flex items-center justify-between bg-black/20 p-2 rounded-lg border border-white/5 transition-all hover:border-white/10"
                  >
                    <div>
                      <p className="text-sm font-medium text-white/90">{addon.name}</p>
                      <p className="text-xs font-bold text-primary">+{formatPrice(addon.price)}</p>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg bg-black/40 px-2 py-1">
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); onAddonChange(addon, -1); }}
                        disabled={qty <= 0}
                        className="p-1 text-white/50 hover:text-white transition-colors disabled:opacity-20 disabled:pointer-events-none"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className={`w-4 text-center text-xs font-bold transition-all ${qty > 0 ? 'text-primary scale-110' : 'text-white'}`}>
                        {qty}
                      </span>
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); onAddonChange(addon, 1); }}
                        className="p-1 text-white/50 hover:text-white transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}