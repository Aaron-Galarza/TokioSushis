import { useEffect } from 'react';
import { AdminCard } from './ui/AdminCard';
import { AdminInput, AdminTextarea, AdminSelect } from './ui/AdminInput';
import { useAdminMenu } from '../hooks/useAdminMenu';

export function MenuTab() {
  const {
    products, cats, addons, reload,
    pForm, setPForm, pEditId, pErr, saveProduct, editProduct, toggleProduct, removeProduct, cancelProduct,
    cForm, setCForm, cEditId, saveCat, editCat, toggleCat, removeCat, cancelCat,
    aForm, setAForm, aEditId, saveAddon, editAddon, toggleAddon, removeAddon, cancelAddon,
  } = useAdminMenu();

  useEffect(() => { reload(); }, [reload]);

  return (
    <div className="space-y-5">
      {/* Categories */}
      <AdminCard>
        <h2 className="font-semibold text-white text-sm mb-4">Categorías del Menú</h2>
        <div className="flex gap-2 mb-4">
          <AdminInput placeholder="Nombre de categoría" value={cForm.name} onChange={e => setCForm(p => ({ ...p, name: e.target.value }))} />
          <AdminInput type="number" placeholder="Orden" value={cForm.order} onChange={e => setCForm(p => ({ ...p, order: e.target.value }))} className="w-24" />
          <button onClick={saveCat} className="bg-primary text-black font-bold px-4 py-2 rounded-lg text-sm hover:bg-primary/90 active:scale-95 transition-all whitespace-nowrap">
            {cEditId ? 'Guardar' : 'Crear'}
          </button>
          {cEditId && <button onClick={cancelCat} className="bg-white/5 text-white/50 px-3 py-2 rounded-lg text-sm">✕</button>}
        </div>
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto overscroll-contain scrollbar-none">
          {cats.map(c => (
            <div key={c._id} className="flex items-center justify-between bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3">
              <div>
                <p className={`font-semibold text-sm ${c.active ? 'text-white' : 'text-white/40 line-through'}`}>{c.name}</p>
                <p className="text-white/30 text-xs">Orden: {c.order}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleCat(c._id)} className={`text-xs px-2 py-1 rounded-lg ${c.active ? 'bg-white/5 text-white/50 hover:text-white' : 'bg-green-900/50 text-green-300 hover:bg-green-900'}`}>
                  {c.active ? 'Desactivar' : 'Activar'}
                </button>
                <button onClick={() => editCat(c)} className="text-xs text-white/40 hover:text-white px-2 py-1 bg-white/5 rounded-lg">Editar</button>
                <button onClick={() => removeCat(c._id)} className="text-xs text-red-400/60 hover:text-red-300 px-2 py-1 bg-white/5 rounded-lg">Borrar</button>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>

      {/* Addons */}
      <AdminCard>
        <h2 className="font-semibold text-white text-sm mb-4">Adicionales</h2>
        <div className="flex gap-2 mb-4">
          <AdminInput placeholder="Nombre" value={aForm.title} onChange={e => setAForm(p => ({ ...p, title: e.target.value }))} />
          <AdminInput type="number" placeholder="Precio" value={aForm.price} onChange={e => setAForm(p => ({ ...p, price: e.target.value }))} className="w-28" />
          <button onClick={saveAddon} className="bg-primary text-black font-bold px-4 py-2 rounded-lg text-sm hover:bg-primary/90 active:scale-95 transition-all whitespace-nowrap">
            {aEditId ? 'Guardar' : 'Crear'}
          </button>
          {aEditId && <button onClick={cancelAddon} className="bg-white/5 text-white/50 px-3 py-2 rounded-lg text-sm">✕</button>}
        </div>
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto overscroll-contain scrollbar-none">
          {addons.map(a => (
            <div key={a._id} className="flex items-center justify-between bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3">
              <p className={`font-semibold text-sm ${a.active ? 'text-white' : 'text-white/40 line-through'}`}>
                {a.title || a.name} — <span className="text-primary">${a.price?.toLocaleString('es-AR')}</span>
              </p>
              <div className="flex gap-2">
                <button onClick={() => toggleAddon(a._id)} className={`text-xs px-2 py-1 rounded-lg ${a.active ? 'bg-white/5 text-white/50 hover:text-white' : 'bg-green-900/50 text-green-300 hover:bg-green-900'}`}>
                  {a.active ? 'Desactivar' : 'Activar'}
                </button>
                <button onClick={() => editAddon(a)} className="text-xs text-white/40 hover:text-white px-2 py-1 bg-white/5 rounded-lg">Editar</button>
                <button onClick={() => removeAddon(a._id)} className="text-xs text-red-400/60 hover:text-red-300 px-2 py-1 bg-white/5 rounded-lg">Borrar</button>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>

      {/* Products */}
      <div className="grid md:grid-cols-[2fr_3fr] gap-5">
        <AdminCard>
          <h2 className="font-semibold text-white text-sm mb-4">{pEditId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
          {pErr && <p className="text-red-400 text-xs mb-2">{pErr}</p>}
          <div className="flex flex-col gap-3">
            <AdminInput placeholder="Título" value={pForm.title} onChange={e => setPForm(p => ({ ...p, title: e.target.value }))} />
            <div className="flex gap-2">
              <AdminInput type="number" placeholder="Precio" value={pForm.price} onChange={e => setPForm(p => ({ ...p, price: e.target.value }))} className="w-32" />
              <AdminSelect value={pForm.category} onChange={e => setPForm(p => ({ ...p, category: e.target.value }))} className="flex-1">
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

        <AdminCard>
          <h2 className="font-semibold text-white text-sm mb-4">Tus Productos</h2>
          <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto overscroll-contain scrollbar-none">
            {products.map(p => {
              const catName = typeof p.category === 'object' ? p.category?.name : (cats.find(c => c._id === p.category)?.name ?? '—');
              return (
                <div key={p._id} className="flex items-center gap-3 bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-3">
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
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
