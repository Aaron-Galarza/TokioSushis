'use client';

import { useEffect, useState, useMemo } from 'react';
import { AdminCard } from './ui/AdminCard';
import { AdminInput, AdminTextarea, AdminSelect } from './ui/AdminInput';
import { IconPickerModal } from './ui/IconPickerModal';
import { AdminActionButtons } from './ui/AdminActionButtons';
import { AdminProductRow } from './ui/AdminProductRow';
import { ImageUploadButton } from './ui/ImageUploadButton';
import { useAdminMenu } from '../hooks/useAdminMenu';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { cloudinaryImage } from '@/lib/image';
import { ConfigurableCatalog } from './ConfigurableCatalog';
import { AddonCategoryList } from './AddonCategoryList';

export function MenuTab() {
  const {
    products, cats, addons, options, groups, reload,
    pForm, setPForm, pEditId, pErr, saveProduct, editProduct, toggleProduct, removeProduct, cancelProduct,
    cForm, setCForm, cEditId, saveCat, editCat, toggleCat, removeCat, cancelCat,
    aForm, setAForm, aEditId, saveAddon, editAddon, toggleAddon, removeAddon, cancelAddon,
  } = useAdminMenu();

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('');
  const [productImageUploading, setProductImageUploading] = useState(false);

  useEffect(() => { reload(); }, [reload]);


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
            {cForm.icon ? <CategoryIcon categoryName="" iconKey={cForm.icon} className="w-4 h-4" /> : <span className="text-xs">🖼</span>}
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
            return (
              <div key={c._id} className="flex items-center justify-between bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <CategoryIcon categoryName={c.name} iconKey={c.icon} className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className={`font-semibold text-sm ${c.active ? 'text-white' : 'text-white/40 line-through'}`}>{c.name}</p>
                  </div>
                </div>
                <AdminActionButtons 
                  active={c.active} 
                  onToggle={() => toggleCat(c._id)} 
                  onEdit={() => editCat(c)} 
                  onDelete={() => removeCat(c._id)} 
                />
              </div>
            );
          })}
        </div>
      </AdminCard>

      <ConfigurableCatalog options={options} groups={groups} reload={reload} />

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
            Categorías asociadas <span className="normal-case ml-1 text-white/20">(vacío = aplica a todas)</span>
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
        <AddonCategoryList categories={cats} addons={addons} onEdit={editAddon} onToggle={toggleAddon} onDelete={removeAddon} />
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
            <div className="space-y-2 rounded-lg border border-white/10 p-3">
              <p className="text-xs font-semibold text-white/70">Tipo de producto</p>
              <AdminSelect value={pForm.tipoProducto} onChange={e => setPForm(p => ({ ...p, tipoProducto: e.target.value as 'simple' | 'configurable', groupIds: e.target.value === 'simple' ? [] : p.groupIds }))}>
                <option value="simple">Simple</option><option value="configurable">Personalizable por pasos</option>
              </AdminSelect>
              {pForm.tipoProducto === 'configurable' && <div className="space-y-2">
                <p className="text-xs text-white/40">Elegí los pasos. El orden de esta lista es el orden que verá el cliente.</p>
                {groups.filter(group => group.activo || pForm.groupIds.includes(group._id)).sort((a, b) => {
                  const ai = pForm.groupIds.indexOf(a._id), bi = pForm.groupIds.indexOf(b._id);
                  return ai < 0 ? (bi < 0 ? a.nombre.localeCompare(b.nombre) : 1) : bi < 0 ? -1 : ai - bi;
                }).map(group => {
                  const index = pForm.groupIds.indexOf(group._id);
                  return <div key={group._id} className="flex items-center justify-between gap-2 rounded-lg bg-white/5 p-2 text-xs text-white/70">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={index >= 0} disabled={!group.activo && index < 0} onChange={() => setPForm(p => ({ ...p, groupIds: index >= 0 ? p.groupIds.filter((id: string) => id !== group._id) : [...p.groupIds, group._id] }))} />{index >= 0 ? `${index + 1}. ` : ''}{group.nombre}{!group.activo ? ' (inactivo)' : ''}</label>
                    {index >= 0 && <span className="flex gap-1"><button disabled={index === 0} onClick={() => setPForm(p => { const ids = [...p.groupIds]; [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]]; return { ...p, groupIds: ids }; })} className="rounded bg-white/10 px-2 disabled:opacity-30" aria-label={`Subir ${group.nombre}`}>↑</button>
                      <button disabled={index === pForm.groupIds.length - 1} onClick={() => setPForm(p => { const ids = [...p.groupIds]; [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]]; return { ...p, groupIds: ids }; })} className="rounded bg-white/10 px-2 disabled:opacity-30" aria-label={`Bajar ${group.nombre}`}>↓</button></span>}
                  </div>;
                })}
              </div>}
            </div>
            <ImageUploadButton
              uploading={productImageUploading}
              setUploading={setProductImageUploading}
              onUploaded={(url) => setPForm(p => ({ ...p, image: url }))}
            />
            <AdminInput
              placeholder="O pegá la URL de la imagen"
              value={pForm.image}
              onChange={e => setPForm(p => ({ ...p, image: e.target.value }))}
              disabled={productImageUploading}
            />
            {/^https?:\/\//.test(pForm.image) && (
              <img src={cloudinaryImage(pForm.image, 300)} alt="Vista previa del producto" className="h-24 w-24 rounded-lg border border-white/10 object-cover" />
            )}
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
              <button onClick={saveProduct} disabled={productImageUploading} className="flex-1 bg-primary text-black font-bold py-2.5 rounded-lg text-sm hover:bg-primary/90 active:scale-95 disabled:opacity-40 transition-all">
                {pEditId ? 'Guardar cambios' : 'Crear producto'}
              </button>
              {pEditId && <button onClick={cancelProduct} disabled={productImageUploading} className="bg-white/5 text-white/50 px-4 py-2.5 rounded-lg text-sm hover:text-white disabled:opacity-40">Cancelar</button>}
            </div>
          </div>
        </AdminCard>

        {/* Listado "Tus Productos" */}
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
                <AdminProductRow
                  key={p._id}
                  product={p}
                  catName={catName}
                  onToggle={() => toggleProduct(p._id)}
                  onEdit={() => editProduct(p)}
                  onDelete={() => removeProduct(p._id)}
                />
              );
            })}
            {filteredProducts.length === 0 && (
              <p className="text-white/20 text-xs text-center py-6">No hay productos en esta categoría.</p>
            )}
          </div>
        </AdminCard>
      </div>

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
