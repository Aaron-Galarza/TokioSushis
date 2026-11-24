'use client';

import { useState } from 'react';
import type { IngredientOption, OptionGroup } from '@/types';
import {
  createOption, updateOption, toggleOption, deleteOption,
  createOptionGroup, updateOptionGroup, toggleOptionGroup, deleteOptionGroup,
} from '@/services/admin.service';
import { AdminCard } from './ui/AdminCard';
import { AdminInput, AdminSelect } from './ui/AdminInput';
import { AdminActionButtons } from './ui/AdminActionButtons';

type Entry = { ingrediente: string; orden: number; activo: boolean; permiteCantidad: boolean; cantidadMaxima: number; precioEspecialActivo: boolean; precioEspecial: number | null };
type GroupForm = { nombre: string; descripcion: string; tipo: 'unico' | 'multiple'; obligatorio: boolean; minimo: number; maximo: number; activo: boolean; ingredientes: Entry[] };
const blankOption = () => ({ nombre: '', descripcion: '', precio: 0, activo: true, disponible: true, orden: 0 });
const blankGroup = (): GroupForm => ({ nombre: '', descripcion: '', tipo: 'unico', obligatorio: false, minimo: 0, maximo: 1, activo: true, ingredientes: [] });
const idOf = (value: string | IngredientOption) => typeof value === 'string' ? value : value._id;
const errorText = (error: unknown) => {
  const response = error as { response?: { data?: { error?: string } } };
  return response.response?.data?.error ?? (error instanceof Error ? error.message : 'No se pudo guardar. Revisá los datos.');
};

export function ConfigurableCatalog({ options, groups, reload }: { options: IngredientOption[]; groups: OptionGroup[]; reload: () => Promise<void> }) {
  const [option, setOption] = useState(blankOption);
  const [optionId, setOptionId] = useState<string | null>(null);
  const [group, setGroup] = useState<GroupForm>(blankGroup);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [errorScope, setErrorScope] = useState<'option' | 'group'>('option');
  const [busy, setBusy] = useState(false);

  const perform = async (action: () => Promise<unknown>, scope: 'option' | 'group' = 'option') => {
    setError(''); setErrorScope(scope); setBusy(true);
    try { await action(); await reload(); }
    catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  };
  const saveOption = () => perform(async () => {
    if (optionId) await updateOption(optionId, option);
    else await createOption(option);
    setOption(blankOption()); setOptionId(null);
  });
  const saveGroup = () => perform(async () => {
    if (!group.ingredientes.length) throw new Error('Elegí al menos un ingrediente');
    if (group.ingredientes.some(entry => entry.precioEspecialActivo &&
      (entry.precioEspecial === null || !Number.isFinite(entry.precioEspecial) || entry.precioEspecial < 0))) {
      throw new Error('Ingresá un precio especial válido para los ingredientes marcados');
    }
    const payload = { ...group, minimo: group.obligatorio ? Math.max(1, group.minimo) : group.minimo, maximo: group.tipo === 'unico' ? 1 : group.maximo,
      ingredientes: group.ingredientes.map(({ precioEspecialActivo, ...entry }, orden) => ({ ...entry, orden,
        cantidadMaxima: entry.permiteCantidad ? entry.cantidadMaxima : 1,
        precioEspecial: precioEspecialActivo ? entry.precioEspecial : null })) };
    if (groupId) await updateOptionGroup(groupId, payload);
    else await createOptionGroup(payload);
    setGroup(blankGroup()); setGroupId(null);
  }, 'group');
  const editGroup = (item: OptionGroup) => {
    setGroupId(item._id);
    setGroup({ nombre: item.nombre, descripcion: item.descripcion ?? '', tipo: item.tipo, obligatorio: item.obligatorio,
      minimo: item.minimo, maximo: item.maximo, activo: item.activo,
      ingredientes: [...item.ingredientes].sort((a, b) => a.orden - b.orden).map(entry => ({ ingrediente: idOf(entry.ingrediente), orden: entry.orden,
        activo: entry.activo, permiteCantidad: entry.permiteCantidad,
        cantidadMaxima: entry.permiteCantidad ? entry.cantidadMaxima : 1,
        precioEspecialActivo: entry.precioEspecial != null,
        precioEspecial: entry.precioEspecial ?? null })) });
  };
  const changeEntry = (id: string, patch: Partial<Entry>) => setGroup(current => ({ ...current,
    ingredientes: current.ingredientes.map(entry => entry.ingrediente === id ? { ...entry, ...patch } : entry) }));
  const toggleEntry = (id: string) => setGroup(current => ({ ...current,
    ingredientes: current.ingredientes.some(entry => entry.ingrediente === id)
      ? current.ingredientes.filter(entry => entry.ingrediente !== id)
      : [...current.ingredientes, { ingrediente: id, orden: current.ingredientes.length, activo: true, permiteCantidad: false, cantidadMaxima: 1, precioEspecialActivo: false, precioEspecial: null }] }));
  const moveEntry = (id: string, delta: number) => setGroup(current => {
    const entries = [...current.ingredientes];
    const index = entries.findIndex(entry => entry.ingrediente === id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= entries.length) return current;
    [entries[index], entries[target]] = [entries[target], entries[index]];
    return { ...current, ingredientes: entries };
  });

  return <div className="grid gap-5 lg:grid-cols-2">
    <AdminCard>
      <h2 className="mb-2 text-sm font-semibold text-white">1. Ingredientes</h2>
      <p className="mb-4 text-xs text-white/40">Opciones reutilizables para los pasos. Son independientes de los adicionales.</p>
      {error && errorScope === 'option' && <p role="alert" className="mb-3 text-xs text-red-400">{error}</p>}
      <div className="space-y-2">
        <AdminInput placeholder="Nombre" value={option.nombre} onChange={e => setOption({ ...option, nombre: e.target.value })} />
        <AdminInput placeholder="Descripción (opcional)" value={option.descripcion} onChange={e => setOption({ ...option, descripcion: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-white/50">Precio<AdminInput type="number" min={0} value={option.precio} onChange={e => setOption({ ...option, precio: Number(e.target.value) })} /></label>
          <label className="text-xs text-white/50">Orden<AdminInput type="number" value={option.orden} onChange={e => setOption({ ...option, orden: Number(e.target.value) })} /></label>
        </div>
        <label className="flex gap-2 text-xs text-white/60"><input type="checkbox" checked={option.disponible} onChange={e => setOption({ ...option, disponible: e.target.checked })} />Disponible para elegir</label>
        <div className="flex gap-2"><button disabled={busy} onClick={saveOption} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black disabled:opacity-50">{optionId ? 'Guardar ingrediente' : 'Crear ingrediente'}</button>
          {optionId && <button onClick={() => { setOption(blankOption()); setOptionId(null); }} className="text-xs text-white/50">Cancelar</button>}</div>
      </div>
      <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
        {options.map(item => <div key={item._id} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 p-2 text-xs">
          <div><b className={item.activo ? 'text-white' : 'text-white/40'}>{item.nombre}</b><span className="ml-2 text-primary">${item.precio}</span><p className="text-white/40">{item.disponible ? 'Disponible' : 'No disponible'}</p></div>
          <AdminActionButtons active={item.activo} onToggle={() => perform(() => toggleOption(item._id))} onEdit={() => { setOption({ nombre: item.nombre, descripcion: item.descripcion ?? '', precio: item.precio, activo: item.activo, disponible: item.disponible, orden: item.orden }); setOptionId(item._id); }} onDelete={() => { if (confirm('¿Eliminar ingrediente?')) perform(() => deleteOption(item._id)); }} />
        </div>)}
      </div>
    </AdminCard>

    <AdminCard>
      <h2 className="mb-2 text-sm font-semibold text-white">2. Grupos y pasos</h2>
      <p className="mb-4 text-xs text-white/40">Definí reglas y elegí los ingredientes de cada paso.</p>
      {error && errorScope === 'group' && <p role="alert" className="mb-3 text-xs text-red-400">{error}</p>}
      <div className="space-y-2">
        <AdminInput placeholder="Nombre del paso" value={group.nombre} onChange={e => setGroup({ ...group, nombre: e.target.value })} />
        <AdminInput placeholder="Descripción (opcional)" value={group.descripcion} onChange={e => setGroup({ ...group, descripcion: e.target.value })} />
        <AdminSelect value={group.tipo} onChange={e => setGroup({ ...group, tipo: e.target.value as GroupForm['tipo'], maximo: e.target.value === 'unico' ? 1 : group.maximo })}><option value="unico">Elegir uno</option><option value="multiple">Elegir varios</option></AdminSelect>
        <label className="flex gap-2 text-xs text-white/60"><input type="checkbox" checked={group.obligatorio} onChange={e => setGroup({ ...group, obligatorio: e.target.checked, minimo: e.target.checked ? Math.max(1, group.minimo) : 0 })} />Obligatorio</label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-white/50">Mínimo<AdminInput type="number" min={0} value={group.minimo} onChange={e => setGroup({ ...group, minimo: Number(e.target.value) })} /></label>
          <label className="text-xs text-white/50">Máximo<AdminInput type="number" min={1} disabled={group.tipo === 'unico'} value={group.maximo} onChange={e => setGroup({ ...group, maximo: Number(e.target.value) })} /></label>
        </div>
        <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-white/10 p-2">
          {[...options].sort((a, b) => {
            const ai = group.ingredientes.findIndex(entry => entry.ingrediente === a._id);
            const bi = group.ingredientes.findIndex(entry => entry.ingrediente === b._id);
            return ai < 0 ? (bi < 0 ? a.nombre.localeCompare(b.nombre) : 1) : bi < 0 ? -1 : ai - bi;
          }).map(item => { const entryIndex = group.ingredientes.findIndex(candidate => candidate.ingrediente === item._id); const entry = group.ingredientes[entryIndex]; return <div key={item._id} className="rounded-lg bg-white/5 p-2 text-xs text-white/70">
            <div className="flex items-center justify-between gap-2"><label className="flex items-center gap-2"><input type="checkbox" checked={!!entry} onChange={() => toggleEntry(item._id)} />{entry ? `${entryIndex + 1}. ` : ''}{item.nombre}</label>
              {entry && <span className="flex gap-1"><button type="button" disabled={entryIndex === 0} onClick={() => moveEntry(item._id, -1)} className="rounded bg-white/10 px-2 disabled:opacity-30" aria-label={`Subir ${item.nombre}`}>↑</button><button type="button" disabled={entryIndex === group.ingredientes.length - 1} onClick={() => moveEntry(item._id, 1)} className="rounded bg-white/10 px-2 disabled:opacity-30" aria-label={`Bajar ${item.nombre}`}>↓</button></span>}</div>
            {entry && <div className="mt-1.5 space-y-1.5 border-t border-white/5 pt-1.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                <label className="inline-flex items-center gap-1 whitespace-nowrap"><input type="checkbox" checked={entry.activo} onChange={e => changeEntry(item._id, { activo: e.target.checked })} />Activo</label>
                <label className="inline-flex items-center gap-1 whitespace-nowrap"><input type="checkbox" checked={entry.permiteCantidad} onChange={e => changeEntry(item._id, { permiteCantidad: e.target.checked, cantidadMaxima: e.target.checked ? entry.cantidadMaxima : 1 })} />Permitir cantidad</label>
                <label className="inline-flex items-center gap-1 whitespace-nowrap"><input type="checkbox" checked={entry.precioEspecialActivo} onChange={e => changeEntry(item._id, { precioEspecialActivo: e.target.checked, precioEspecial: e.target.checked ? entry.precioEspecial : null })} />Precio especial</label>
              </div>
              {(entry.permiteCantidad || entry.precioEspecialActivo) && <div className="flex flex-wrap items-end gap-2">
                {entry.permiteCantidad && <label className="w-28">Máx. unidades<AdminInput type="number" min={1} value={entry.cantidadMaxima} onChange={e => changeEntry(item._id, { cantidadMaxima: Number(e.target.value) })} className="py-1.5" /></label>}
                {entry.precioEspecialActivo && <label className="w-32">Precio en este paso<AdminInput type="number" min={0} required placeholder="Ingresá precio" value={entry.precioEspecial ?? ''} onChange={e => changeEntry(item._id, { precioEspecial: e.target.value === '' ? null : Number(e.target.value) })} className="py-1.5" /></label>}
              </div>}
            </div>}
          </div>; })}
        </div>
        <div className="flex gap-2"><button disabled={busy} onClick={saveGroup} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black disabled:opacity-50">{groupId ? 'Guardar paso' : 'Crear paso'}</button>
          {groupId && <button onClick={() => { setGroup(blankGroup()); setGroupId(null); }} className="text-xs text-white/50">Cancelar</button>}</div>
      </div>
      <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
        {groups.map(item => <div key={item._id} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 p-2 text-xs"><div><b className={item.activo ? 'text-white' : 'text-white/40'}>{item.nombre}</b><p className="text-white/40">{item.tipo} · {item.ingredientes.length} ingredientes · mínimo {item.minimo}, máximo {item.maximo}</p></div>
          <AdminActionButtons active={item.activo} onToggle={() => perform(() => toggleOptionGroup(item._id), 'group')} onEdit={() => editGroup(item)} onDelete={() => { if (confirm('¿Eliminar paso?')) perform(() => deleteOptionGroup(item._id), 'group'); }} /></div>)}
      </div>
    </AdminCard>
  </div>;
}
