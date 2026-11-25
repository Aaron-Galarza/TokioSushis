'use client';

import { useId, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { AdminActionButtons } from './ui/AdminActionButtons';

interface Category {
  _id: string;
  name: string;
  active: boolean;
  icon?: string;
}

interface AdminAddon {
  _id: string;
  title?: string;
  name?: string;
  price: number;
  active: boolean;
  categories?: (string | { _id: string; name?: string } | null)[];
}

interface Props {
  categories: Category[];
  addons: AdminAddon[];
  onEdit: (addon: AdminAddon) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const categoryIds = (addon: AdminAddon) => (addon.categories ?? []).flatMap(category => category ? [typeof category === 'string' ? category : category._id] : []);

export function AddonCategoryList({ categories, addons, onEdit, onToggle, onDelete }: Props) {
  const [view, setView] = useState<'category' | 'addon'>('category');
  const [query, setQuery] = useState('');
  const searchId = useId();
  const term = normalize(query.trim());
  const indexed = useMemo(() => {
    const names = new Map(categories.map(category => [category._id, category.name]));
    return addons.map(addon => {
      const ids = categoryIds(addon);
      const labels = ids.map(id => names.get(id) ?? 'Categoría no disponible');
      return { addon, ids, labels: labels.length ? labels.join(', ') : 'Todas las categorías' };
    });
  }, [addons, categories]);
  const groups = categories.map(category => ({
    category,
    entries: indexed.filter(entry =>
      (entry.ids.length === 0 || entry.ids.includes(category._id)) &&
      (!term || normalize(category.name).includes(term) || normalize(entry.addon.title || entry.addon.name || '').includes(term))
    ),
  })).filter(group => !term || normalize(group.category.name).includes(term) || group.entries.length > 0);
  const matchingAddons = indexed.filter(entry => !term || normalize(`${entry.addon.title || entry.addon.name || ''} ${entry.labels}`).includes(term));
  const orphaned = indexed.filter(entry => entry.ids.length > 0 && !entry.ids.some(id => categories.some(category => category._id === id)));

  function renderRow(entry: typeof indexed[number]) {
    const { addon } = entry;
    return (
      <div key={addon._id} className="flex min-w-0 flex-col gap-2 rounded-lg border border-white/10 bg-[#1A1A1A] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className={`break-words text-sm font-semibold ${addon.active ? 'text-white' : 'text-white/50 line-through'}`}>
            {addon.title || addon.name} <span className="text-primary">— ${addon.price.toLocaleString('es-AR')}</span>
          </p>
          <p className="mt-1 break-words text-xs text-white/60">{entry.labels}{!addon.active ? ' · Inactivo' : ''}</p>
        </div>
        <div className="self-end sm:self-auto">
          <AdminActionButtons active={addon.active} onToggle={() => onToggle(addon._id)} onEdit={() => onEdit(addon)} onDelete={() => onDelete(addon._id)} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" aria-label="Vista de adicionales">
        {([['category', 'Por categoría'], ['addon', 'Por adicional']] as const).map(([value, label]) => (
          <button key={value} type="button" aria-pressed={view === value} onClick={() => setView(value)} className={`min-h-11 rounded-lg border px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary ${view === value ? 'border-primary/40 bg-primary/15 text-primary' : 'border-white/10 bg-white/5 text-white/60 hover:text-white'}`}>{label}</button>
        ))}
      </div>
      <label htmlFor={searchId} className="block text-xs text-white/60">Buscar adicional o categoría</label>
      <input id={searchId} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Ej.: salsa o rolls" className="min-h-11 w-full rounded-lg border border-white/10 bg-[#1A1A1A] px-3 text-sm text-white placeholder:text-white/40 focus-visible:outline-2 focus-visible:outline-primary" />
      <p className="text-xs text-white/60">{addons.length} adicionales únicos. Los que aplican a todas se incluyen en cada categoría.</p>
      <div className="max-h-[480px] space-y-2 overflow-y-auto overscroll-contain">
        {view === 'category' ? <>
          {groups.map(({ category, entries }) => (
            <details key={category._id} className="group overflow-hidden rounded-xl border border-white/10 bg-[#111111]">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 py-3 focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                <CategoryIcon categoryName={category.name} iconKey={category.icon} className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 break-words text-sm font-semibold text-white">{category.name}{!category.active ? ' (inactiva)' : ''}</span>
                <span className="shrink-0 text-xs text-primary">{entries.length} adicionales</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-white/60 group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="space-y-2 border-t border-white/10 p-2">
                {entries.length ? entries.map(renderRow) : <p className="p-2 text-xs text-white/60">Esta categoría no tiene adicionales.</p>}
              </div>
            </details>
          ))}
          {!term && orphaned.length > 0 && <div className="space-y-2"><p className="text-xs text-white/60">Categoría no disponible</p>{orphaned.map(renderRow)}</div>}
          {groups.length === 0 && <p className="py-4 text-center text-sm text-white/60">{categories.length ? 'No hay coincidencias. Probá con otro nombre.' : 'Todavía no hay categorías. Podés consultar la vista Por adicional.'}</p>}
        </> : matchingAddons.length ? matchingAddons.map(renderRow) : <p className="py-4 text-center text-sm text-white/60">{addons.length ? 'No hay coincidencias. Probá con otro nombre.' : 'Todavía no hay adicionales cargados.'}</p>}
      </div>
    </div>
  );
}
