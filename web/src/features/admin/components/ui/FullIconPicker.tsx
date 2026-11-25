'use client';

import { useDeferredValue, useMemo, useRef, useState } from 'react';
import { DynamicIcon } from 'lucide-react/dynamic';
import type { IconName } from 'lucide-react/dynamic';
import type { IconPickerModalProps } from './IconPickerModal';
import { CURATED_CATEGORY_ICONS } from './curatedCategoryIcons';

const COLUMNS = 5;
const ROW_HEIGHT = 72;
const VISIBLE_ROWS = 10;

export function FullIconPicker({ selected, onSelect, onClose }: IconPickerModalProps) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [scrollTop, setScrollTop] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const matches = useMemo(() => {
    const term = deferredQuery.trim().toLowerCase().replace(/\s+/g, '-');
    return term ? CURATED_CATEGORY_ICONS.filter(name => name.includes(term)) : CURATED_CATEGORY_ICONS;
  }, [deferredQuery]);
  const rowCount = Math.ceil(matches.length / COLUMNS);
  const firstRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 2);
  const lastRow = Math.min(rowCount, firstRow + VISIBLE_ROWS);
  const visible = matches.slice(firstRow * COLUMNS, lastRow * COLUMNS);

  function changeQuery(value: string) {
    setQuery(value);
    setScrollTop(0);
    if (listRef.current) listRef.current.scrollTop = 0;
  }

  function choose(name: IconName) {
    onSelect(`lucide:${name}`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Elegir ícono de categoría"
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1A1A1A] p-4 shadow-2xl sm:p-5"
        onClick={event => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Elegir ícono</p>
            <p className="text-xs text-white/45">{matches.length} de {CURATED_CATEGORY_ICONS.length} íconos</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg px-2 py-1 text-white/50 hover:text-white">✕</button>
        </div>
        <input
          autoFocus
          type="search"
          value={query}
          onChange={event => changeQuery(event.target.value)}
          placeholder="Buscar ícono, por ejemplo: fish o soup"
          aria-label="Buscar íconos"
          className="mb-3 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-primary/60"
        />
        <div
          ref={listRef}
          onScroll={event => setScrollTop(event.currentTarget.scrollTop)}
          className="min-h-0 overflow-y-auto overscroll-contain rounded-xl"
          style={{ height: 'min(52dvh, 432px)' }}
        >
          {matches.length === 0 ? (
            <p className="p-6 text-center text-sm text-white/50">No hay íconos con ese nombre.</p>
          ) : (
            <>
              <div style={{ height: firstRow * ROW_HEIGHT }} />
              <div className="grid grid-cols-5 gap-x-1">
                {visible.map(name => (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    onClick={() => choose(name)}
                    className={`flex h-[72px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-1 transition-colors ${selected === `lucide:${name}` ? 'border-primary/50 bg-primary/20 text-primary' : 'border-transparent text-white/55 hover:border-white/15 hover:bg-white/5 hover:text-white'}`}
                  >
                    <DynamicIcon name={name} className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="w-full truncate text-center text-[10px]">{name}</span>
                  </button>
                ))}
              </div>
              <div style={{ height: (rowCount - lastRow) * ROW_HEIGHT }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
