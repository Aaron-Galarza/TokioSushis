'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { Product, ProductConfiguration, ResolvedGroup, SelectedIngredient } from '@/types';
import { menuService } from '@/services/menu.service';
import { formatPrice } from '@/lib/format';

type Selection = Record<string, Record<string, number>>;
export function ProductConfigurator({ product, initial, onConfirm, onClose }: {
  product: Product; initial?: SelectedIngredient[];
  onConfirm: (ingredients: SelectedIngredient[], detail: Product) => void;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [selection, setSelection] = useState<Selection>(() => {
    const values: Selection = {};
    for (const item of initial ?? []) values[item.grupoId] = { ...(values[item.grupoId] ?? {}), [item.ingredienteId]: item.cantidad };
    return values;
  });
  useEffect(() => {
    let active = true;
    menuService.getProductDetail(product.id).then(data => { if (active) setDetail(data); }).catch(() => { if (active) setError('No pudimos cargar los pasos del producto.'); });
    return () => { active = false; };
  }, [product.id]);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  const config: ProductConfiguration | undefined = detail?.configuracion;
  const groups = useMemo(() => config?.grupos ?? [], [config]);
  const chosen = groups.flatMap(group => group.ingredientes.filter(option => (selection[group.grupoId]?.[option.ingredienteId] ?? 0) > 0).map(option => ({
    grupoId: group.grupoId, grupoNombre: group.nombre,
    ingredienteId: option.ingredienteId, ingredienteNombre: option.nombre,
    cantidad: selection[group.grupoId][option.ingredienteId], precio: option.precio,
  })));
  const price = (detail?.price ?? product.price) + chosen.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const problem = groups.length === 0 ? 'No hay pasos disponibles para este producto.' : groups.map(group => {
    if (!group.ingredientes.length) return `No hay opciones disponibles en "${group.nombre}".`;
    const count = chosen.filter(item => item.grupoId === group.grupoId).length;
    if (count < Math.max(group.minimo, group.obligatorio ? 1 : 0)) return `Completá "${group.nombre}".`;
    if (count > group.maximo || (group.tipo === 'unico' && count > 1)) return `Revisá "${group.nombre}".`;
    return '';
  }).find(Boolean) ?? '';

  const select = (group: ResolvedGroup, optionId: string) => setSelection(current => {
    const entries = { ...(current[group.grupoId] ?? {}) };
    if (group.tipo === 'unico') {
      return { ...current, [group.grupoId]: entries[optionId] ? {} : { [optionId]: 1 } };
    }
    if (entries[optionId]) {
      delete entries[optionId];
    } else {
      const selectedCount = group.ingredientes.filter(option => (entries[option.ingredienteId] ?? 0) > 0).length;
      if (selectedCount >= group.maximo) return current;
      entries[optionId] = 1;
    }
    return { ...current, [group.grupoId]: entries };
  });
  const changeQuantity = (groupId: string, optionId: string, delta: number, max: number) => setSelection(current => {
    const entries = { ...(current[groupId] ?? {}) };
    entries[optionId] = Math.max(0, Math.min(max, (entries[optionId] ?? 0) + delta));
    return { ...current, [groupId]: entries };
  });

  if (typeof document === 'undefined') return null;
  return createPortal(<div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={`Personalizar ${product.title}`}>
    <div className="flex max-h-[92dvh] w-full max-w-xl flex-col rounded-t-2xl border border-white/10 bg-[#161616] text-white shadow-2xl sm:rounded-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 p-4">
        <div><p className="text-[10px] uppercase tracking-widest text-primary">Personalizá tu pedido</p><h2 className="text-lg font-bold">{product.title}</h2></div>
        <button onClick={onClose} className="rounded-lg p-2 text-white/60 hover:bg-white/10" aria-label="Cerrar"><X className="h-5 w-5" /></button>
      </header>
      <div className="space-y-5 overflow-y-auto p-4">
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        {!detail && !error && <p className="text-sm text-white/50">Cargando opciones...</p>}
        {groups.map((group, index) => { const selectedCount = group.ingredientes.filter(option => (selection[group.grupoId]?.[option.ingredienteId] ?? 0) > 0).length;
          const atLimit = group.tipo === 'multiple' && selectedCount >= group.maximo;
          const optionWord = group.maximo === 1 ? 'opción' : 'opciones';
          const selectionRule = group.tipo === 'unico' ? 'Elegí una opción' : group.minimo === group.maximo ? `Elegí exactamente ${group.maximo} ${optionWord}` : group.minimo === 0 ? `Elegí hasta ${group.maximo} ${optionWord}` : `Elegí entre ${group.minimo} y ${group.maximo} opciones`;
          return <section key={group.grupoId} className="space-y-2">
          <div><h3 className="text-sm font-semibold"><span className="mr-2 text-primary">{index + 1}.</span>{group.nombre}</h3>
            <p className="text-xs text-white/40">{group.descripcion ? `${group.descripcion} · ` : ''}{group.obligatorio ? 'Obligatorio' : 'Opcional'} · {selectionRule}{group.tipo === 'multiple' ? ` · ${selectedCount}/${group.maximo} elegidos` : ''}</p></div>
          <div className="space-y-2">{group.ingredientes.map(option => { const quantity = selection[group.grupoId]?.[option.ingredienteId] ?? 0; const disabled = atLimit && quantity === 0; return <div key={option.ingredienteId} className={`flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-3 ${disabled ? 'opacity-45' : ''}`}>
            <button type="button" disabled={disabled} aria-pressed={quantity > 0} onClick={() => select(group, option.ingredienteId)} className="flex min-w-0 items-center gap-2 text-left text-sm disabled:cursor-not-allowed"><span className={`flex h-4 w-4 shrink-0 items-center justify-center border ${group.tipo === 'unico' ? 'rounded-sm' : 'rounded-full'} ${quantity ? 'border-primary bg-primary text-black' : 'border-white/40'}`}>{quantity ? '✓' : ''}</span><span>{option.nombre}</span></button>
            <div className="flex shrink-0 items-center gap-2 text-xs"><span className="text-primary">{option.precio ? `+${formatPrice(option.precio)}` : 'Sin costo'}</span>
              {quantity > 0 && option.permiteCantidad && <span className="flex items-center gap-2 rounded-lg border border-white/10"><button onClick={() => changeQuantity(group.grupoId, option.ingredienteId, -1, option.cantidadMaxima)} className="px-2 py-1">−</button>{quantity}<button onClick={() => changeQuantity(group.grupoId, option.ingredienteId, 1, option.cantidadMaxima)} className="px-2 py-1">+</button></span>}</div>
          </div>; })}</div>
          {atLimit && <p className="text-xs text-white/50">Llegaste al máximo. Desmarcá una opción elegida si querés cambiarla.</p>}
        </section>; })}
      </div>
      <footer className="space-y-2 border-t border-white/10 p-4"><div className="flex justify-between text-sm"><span>Precio estimado por unidad</span><b className="text-primary">{formatPrice(price)}</b></div>
        {detail && problem && <p className="text-xs text-white/50">{problem}</p>}
        <button disabled={!detail || !!problem} onClick={() => { if (detail) onConfirm(chosen, detail); }} className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40">Confirmar selección</button>
      </footer>
    </div>
  </div>, document.body);
}
