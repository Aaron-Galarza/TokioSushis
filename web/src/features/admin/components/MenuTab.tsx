'use client';

import { useEffect, useState, useMemo } from 'react';
import { AdminCard } from './ui/AdminCard';
import { AdminInput, AdminTextarea, AdminSelect } from './ui/AdminInput';
import { useAdminMenu } from '../hooks/useAdminMenu';
import { CATEGORY_ICON_OPTIONS, getCategoryIcon } from '@/lib/categoryIcons';

// ── Mini modal de selección de ícono ────────────────────────────────────────
function IconPickerModal({
  selected,
  onSelect,
  onClose,
}: {
  selected: string;
  onSelect: (name: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-5 w-80 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-white text-sm font-semibold">Elegir ícono</p>
          <button onClick={onClose} className="text-white/30 hover:text-white text-xs">✕</button>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {CATEGORY_ICON_OPTIONS.map(({ name, icon: Icon }) => (
            <button
              key={name}
              type="button"
              onClick={() => { onSelect(name); onClose(); }}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all
                ${selected === name
                  ? 'bg-primary/20 border-primary/50 text-primary'
                  : 'bg-[#0A0A0A] border-white/5 text-white/40 hover:border-white/20 hover:text-white/70'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] truncate w-full text-center">{name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MenuTab ─────────────────────────────────────────────────────────────────
export function MenuTab() {
  const {
    products, cats, addons, reload,
    pForm, setPForm, pEditId, pErr, saveProduct, editProduct, toggleProduct, removeProduct, cancelProduct,
    cForm, setCForm, cEditId, saveCat, editCat, toggleCat, removeCat, cancelCat,
    aForm, setAForm, aEditId, saveAddon, editAddon, toggleAddon, removeAddon, cancelAddon,
  } = useAdminMenu();

  const [showIconPicker, setShowIconPicker] = useState(false);
  
  // 🔍 Estado local para el Filtro Rápido por Categoría
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('');

  useEffect(() => { reload(); }, [reload]);

  // Ícono actual del form
  const SelectedIcon = cForm.icon ? getCategoryIcon('', cForm.icon) : null;

  // 🛡️ Filtro reactivo para la lista de "Tus Productos"
  const filteredProducts = useMemo(() => {
    if (!selectedCatFilter) return products;
    return products.filter(p => {
      const prodCatId = typeof p.category === 'object' ? p.category?._id : p.category;
      return prodCatId === selectedCatFilter;
    });
  }, [products, selectedCatFilter]);

  return (
    <div className="space-y-5">

      {/* ── Categorías ── */}
      <AdminCard>
        <h2 className="font-semibold text-white text-sm mb-4">Categorías del Menú</h2>
        <div className="flex gap-2 mb-4">
          <AdminInput
            placeholder="Nombre de categoría"
            value={cForm.name}
            onChange={e => setCForm(p => ({ ...p, name: e.target.value }))}
          />

          {/* Botón selector de ícono */}
          <button
            type="button"
            onClick={() => setShowIconPicker(true)}
            title="Elegir ícono"
            className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 transition-all
              ${cForm.icon
                ? 'bg-primary/15 border-primary/40 text-primary'
                : 'bg-white/5 border-white/10 text-white/30 hover:border-white/30 hover:text-white/60'
              }`}
          >
            {SelectedIcon ? <SelectedIcon className="w-4 h-4" /> : <span className="text-xs">🖼</span>}
          </button>
          
          <button
            onClick={saveCat}
            className="bg-primary text-black font-bold px-4 py-2 rounded-lg text-sm hover:bg-primary/90 active:scale-95 transition-all whitespace-nowrap"
          >
            {cEditId ? 'Guardar' : 'Crear'}
          </button>
          {cEditId && (
            <button onClick={cancelCat} className="bg-white/5 text-white/50 px-3 py-2 rounded-lg text-sm">✕</button>
          )}
        </div>

        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto overscroll-contain scrollbar-none">
          {cats.map(c => {
            const CatIcon = getCategoryIcon(c.name, c.icon);
            return (
              <div key={c._id} className="flex items-center justify-between bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <CatIcon className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className={`font-semibold text-sm ${c.active ? 'text-white' : 'text-white/40 line-through'}`}>{c.name}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleCat(c._id)} className={`text-xs px-2 py-1 rounded-lg ${c.active ? 'bg-white/5 text-white/50 hover:text-white' : 'bg-green-900/50 text-green-300 hover:bg-green-900'}`}>
                    {c.active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => editCat(c)} className="text-xs text-white/40 hover:text-white px-2 py-1 bg-white/5 rounded-lg">Editar</button>
                  <button onClick={() => removeCat(c._id)} className="text-xs text-red-400/60 hover:text-red-300 px-2 py-1 bg-white/5 rounded-lg">Borrar</button>
                </div>
              </div>
            );
          })}
        </div>
      </AdminCard>

      {/* ── Adicionales ── */}
      <AdminCard>
        <h2 className="font-semibold text-white text-sm mb-4">Adicionales</h2>
        <div className="flex gap-2 mb-3">
          <AdminInput placeholder="Nombre" value={aForm.title} onChange={e => setAForm(p => ({ ...p, title: e.target.value }))} />
          <AdminInput type="number" placeholder="Precio" value={aForm.price} onChange={e => setAForm(p => ({ ...p, price: e.target.value }))} className="w-28" />
          <button onClick={saveAddon} className="bg-primary text-black font-bold px-4 py-2 rounded-lg text-sm hover:bg-primary/90 active:scale-95 transition-all whitespace-nowrap">
            {aEditId ? 'Guardar' : 'Crear'}
          </button>
          {aEditId && <button onClick={cancelAddon} className="bg-white/5 text-white/50 px-3 py-2 rounded-lg text-sm">✕</button>}
        </div>
        <div className="mb-4">
          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">
            Categorías asociadas
            <span className="normal-case ml-1 text-white/20">(vacío = aplica a todas)</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {cats.filter(c => c.active).map(c => {
              const selected = aForm.categories.includes(c._id);
              return (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => setAForm(p => ({
                    ...p,
                    categories: selected
                      ? p.categories.filter((id: string) => id !== c._id)
                      : [...p.categories, c._id],
                  }))}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all
                    ${selected
                      ? 'bg-primary text-black border-primary'
                      : 'bg-white/5 text-white/40 border-white/10 hover:border-white/30 hover:text-white/70'
                    }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto overscroll-contain scrollbar-none">
          {addons.map(a => {
            const catLabels: string[] = (a.categories ?? []).map((c: any) =>
              typeof c === 'object' ? c.name : (cats.find((mc: any) => mc._id === c)?.name ?? c)
            );
            return (
              <div key={a._id} className="flex items-center justify-between bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3">
                <div className="flex flex-col min-w-0">
                  <p className={`font-semibold text-sm ${a.active ? 'text-white' : 'text-white/40 line-through'}`}>
                    {a.title || a.name} — <span className="text-primary">${a.price?.toLocaleString('es-AR')}</span>
                  </p>
                  <p className="text-[11px] text-white/30 truncate">
                    {catLabels.length > 0 ? catLabels.join(', ') : <span className="italic text-white/20">Todas las categorías</span>}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => toggleAddon(a._id)} className={`text-xs px-2 py-1 rounded-lg ${a.active ? 'bg-white/5 text-white/50 hover:text-white' : 'bg-green-900/50 text-green-300 hover:bg-green-900'}`}>
                    {a.active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => editAddon(a)} className="text-xs text-white/40 hover:text-white px-2 py-1 bg-white/5 rounded-lg">Editar</button>
                  <button onClick={() => removeAddon(a._id)} className="text-xs text-red-400/60 hover:text-red-300 px-2 py-1 bg-white/5 rounded-lg">Borrar</button>
                </div>
              </div>
            );
          })}
        </div>
      </AdminCard>

      {/* ── Productos ── */}
      <div className="grid md:grid-cols-[2fr_3fr] gap-5">
        
        {/* Formulario de Alta/Edición */}
        <AdminCard>
          <h2 className="font-semibold text-white text-sm mb-4">{pEditId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
          {pErr && <p className="text-red-400 text-xs mb-2">{pErr}</p>}
          <div className="flex flex-col gap-3">
            <AdminInput placeholder="Título" value={pForm.title} onChange={e => setPForm(p => ({ ...p, title: e.target.value }))} />
            
            <div className="grid grid-cols-2 gap-2">
              <AdminInput type="number" placeholder="Precio" value={pForm.price} onChange={e => setPForm(p => ({ ...p, price: e.target.value }))} className="w-full" />
              <AdminSelect value={pForm.category} onChange={e => setPForm(p => ({ ...p, category: e.target.value }))} className="w-full">
                <option value="">Seleccionar categoría</option>
                {cats.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </AdminSelect>
            </div>
            
            <AdminTextarea placeholder="Descripción" value={pForm.description} onChange={e => setPForm(p => ({ ...p, description: e.target.value }))} rows={2} />
            <AdminInput placeholder="URL de imagen (opcional)" value={pForm.image} onChange={e => setPForm(p => ({ ...p, image: e.target.value }))} />
            <label className="flex items-center gap-2 text-sm text-white/50 cursor-pointer">
              <input type="checkbox" checked={pForm.active} onChange={e => setPForm(p => ({ ...p, active: e.target.checked }))} className="accent-primary" /> Activo
            </label>
            <label className="flex items-center gap-2 text-sm text-white/50 cursor-pointer">
              <input type="checkbox" checked={pForm.controlStock} onChange={e => setPForm(p => ({ ...p, controlStock: e.target.checked }))} className="accent-primary" /> Controlar stock
            </label>
            {pForm.controlStock && (
              <AdminInput type="number" placeholder="Stock disponible" value={pForm.stock} onChange={e => setPForm(p => ({ ...p, stock: e.target.value }))} min={0} />
            )}
            <div className="flex gap-2">
              <button onClick={saveProduct} className="flex-1 bg-primary text-black font-bold py-2.5 rounded-lg text-sm hover:bg-primary/90 active:scale-95 transition-all">
                {pEditId ? 'Guardar cambios' : 'Crear producto'}
              </button>
              {pEditId && <button onClick={cancelProduct} className="bg-white/5 text-white/50 px-4 py-2.5 rounded-lg text-sm hover:text-white">Cancelar</button>}
            </div>
          </div>
        </AdminCard>

        {/* Listado "Tus Productos" con Filtro Rápido */}
        <AdminCard>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h2 className="font-semibold text-white text-sm">Tus Productos</h2>
            
            <AdminSelect 
              value={selectedCatFilter} 
              onChange={e => setSelectedCatFilter(e.target.value)} 
              className="w-full sm:w-48 py-1 px-2 text-xs"
            >
              <option value="">Todas las categorías</option>
              {cats.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </AdminSelect>
          </div>

          <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto overscroll-contain scrollbar-none">
            {filteredProducts.map(p => {
              const catName = typeof p.category === 'object' ? p.category?.name : (cats.find(c => c._id === p.category)?.name ?? '—');
              return (
                <div key={p._id} className="flex items-center gap-3 bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-3 animate-in fade-in duration-100">
                  {p.image && <img src={p.image} alt={p.title} className="w-10 h-10 rounded-lg object-cover shrink-0 bg-zinc-900" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold text-sm truncate ${p.active ? 'text-white' : 'text-white/40 line-through'}`}>{p.title}</p>
                      {p.controlStock && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${(p.stock ?? 0) > 0 ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'}`}>Stock: {p.stock ?? 0}</span>}
                    </div>
                    <p className="text-[11px] text-white/30">{catName} · <span className="text-primary">${p.price?.toLocaleString('es-AR')}</span></p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => toggleProduct(p._id)} className={`text-xs px-2 py-1 rounded-lg ${p.active ? 'bg-white/5 text-white/50 hover:text-white' : 'bg-green-900/50 text-green-300'}`}>
                      {p.active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button onClick={() => editProduct(p)} className="text-xs text-white/40 hover:text-white px-2 py-1 bg-white/5 rounded-lg">Editar</button>
                    <button onClick={() => removeProduct(p._id)} className="text-xs text-red-400/60 hover:text-red-300 px-2 py-1 bg-white/5 rounded-lg">Borrar</button>
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <p className="text-white/20 text-xs text-center py-6">No hay productos en esta categoría.</p>
            )}
          </div>
        </AdminCard>
      </div>

      {/* Modal de selección de ícono */}
      {showIconPicker && (
        <IconPickerModal
          selected={cForm.icon}
          onSelect={icon => setCForm(p => ({ ...p, icon }))}
          onClose={() => setShowIconPicker(false)}
        />
      )}

    </div>
  );
}