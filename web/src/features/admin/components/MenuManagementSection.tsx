import { AdminCard } from './ui/AdminCard';
import { AdminInput, AdminSelect } from './ui/AdminInput';

interface Props {
  menu: {
    cats: any[];
    cForm: { name: string; order: string };
    setCForm: (updater: (p: any) => any) => void;
    cEditId: string | null;
    saveCat: () => void;
    editCat: (cat: any) => void;
    toggleCat: (id: string) => void;
    removeCat: (id: string) => void;
    addons: any[];
    aForm: { title: string; price: string };
    setAForm: (updater: (p: any) => any) => void;
    aEditId: string | null;
    saveAddon: () => void;
    editAddon: (a: any) => void;
    toggleAddon: (id: string) => void;
    removeAddon: (id: string) => void;
    products: any[];
    pForm: { title: string; price: string; category: string; description: string; image: string; controlStock: boolean; stock: string };
    setPForm: (updater: (p: any) => any) => void;
    pEditId: string | null;
    pErr: string;
    saveProduct: () => void;
    editProduct: (p: any) => void;
    toggleProduct: (id: string) => void;
    removeProduct: (id: string) => void;
    cancelProduct: () => void;
  };
}

export function MenuManagementSection({ menu }: Props) {
  return (
    <>
      <div className="grid md:grid-cols-2 gap-5">
        <AdminCard>
          <h2 className="font-semibold text-white text-sm mb-3">Categorías del Menú</h2>
          <div className="flex gap-2 mb-3">
            <AdminInput placeholder="Nueva categoría" value={menu.cForm.name} onChange={e => menu.setCForm(p => ({ ...p, name: e.target.value }))} className="py-2" />
            <AdminInput type="number" placeholder="Orden" value={menu.cForm.order} onChange={e => menu.setCForm(p => ({ ...p, order: e.target.value }))} className="w-20 py-2" />
            <button onClick={menu.saveCat} className="bg-primary text-black font-bold px-3 py-2 rounded-lg text-xs hover:bg-primary/90 active:scale-95 transition-all whitespace-nowrap">
              {menu.cEditId ? 'OK' : 'Crear'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {menu.cats.map(c => (
              <div key={c._id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-all ${c.active ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white/5 border-white/10 text-white/30 line-through'}`}>
                {c.name}
                <button onClick={() => menu.editCat(c)} className="text-white/30 hover:text-white text-[10px]">✏</button>
                <button onClick={() => menu.toggleCat(c._id)} className="text-white/20 hover:text-white text-[10px]">{c.active ? '◉' : '○'}</button>
                <button onClick={() => menu.removeCat(c._id)} className="text-white/20 hover:text-red-400 text-[10px]">✕</button>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="font-semibold text-white text-sm mb-3">Adicionales</h2>
          <div className="flex gap-2 mb-3">
            <AdminInput placeholder="Nombre" value={menu.aForm.title} onChange={e => menu.setAForm(p => ({ ...p, title: e.target.value }))} className="py-2" />
            <AdminInput type="number" placeholder="Precio" value={menu.aForm.price} onChange={e => menu.setAForm(p => ({ ...p, price: e.target.value }))} className="w-24 py-2" />
            <button onClick={menu.saveAddon} className="bg-primary text-black font-bold px-3 py-2 rounded-lg text-xs hover:bg-primary/90 active:scale-95 transition-all whitespace-nowrap">
              {menu.aEditId ? 'OK' : 'Crear'}
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {menu.addons.map(a => (
              <div key={a._id} className="flex items-center justify-between bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2">
                <span className={`text-sm ${a.active ? 'text-white' : 'text-white/30 line-through'}`}>{a.title || a.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-primary text-sm">${a.price?.toLocaleString('es-AR')}</span>
                  <button onClick={() => menu.editAddon(a)} className="text-white/20 hover:text-white text-xs transition-colors">✏</button>
                  <button onClick={() => menu.toggleAddon(a._id)} className="text-white/20 hover:text-white text-xs transition-colors">{a.active ? '◉' : '○'}</button>
                  <button onClick={() => menu.removeAddon(a._id)} className="text-white/20 hover:text-red-400 text-xs transition-colors">✕</button>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      <div className="grid md:grid-cols-[2fr_3fr] gap-5">
        <AdminCard>
          <h2 className="font-semibold text-white text-sm mb-3">{menu.pEditId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
          {menu.pErr && <p className="text-red-400 text-xs mb-2">{menu.pErr}</p>}
          <div className="flex flex-col gap-2">
            <AdminInput placeholder="Nombre del producto" value={menu.pForm.title} onChange={e => menu.setPForm(p => ({ ...p, title: e.target.value }))} className="py-2" />
            <div className="flex gap-2">
              <AdminInput type="number" placeholder="Precio" value={menu.pForm.price} onChange={e => menu.setPForm(p => ({ ...p, price: e.target.value }))} className="flex-1 py-2" />
              <AdminSelect value={menu.pForm.category} onChange={e => menu.setPForm(p => ({ ...p, category: e.target.value }))} className="flex-1 py-2">
                <option value="">Categoría</option>
                {menu.cats.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </AdminSelect>
            </div>
            <textarea placeholder="Descripción" value={menu.pForm.description} onChange={e => menu.setPForm(p => ({ ...p, description: e.target.value }))} rows={2}
              className="bg-[#0A0A0A] text-white px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-primary/60 text-sm w-full placeholder:text-white/25 resize-none" />
            <AdminInput placeholder="URL de imagen (opcional)" value={menu.pForm.image} onChange={e => menu.setPForm(p => ({ ...p, image: e.target.value }))} className="py-2" />
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-1.5 text-xs text-white/50 cursor-pointer">
                <input type="checkbox" checked={menu.pForm.controlStock} onChange={e => menu.setPForm(p => ({ ...p, controlStock: e.target.checked }))} className="accent-primary" /> Stock
              </label>
              {menu.pForm.controlStock && <AdminInput type="number" placeholder="Cant." value={menu.pForm.stock} onChange={e => menu.setPForm(p => ({ ...p, stock: e.target.value }))} min={0} className="w-20 py-2" />}
            </div>
            <div className="flex gap-2">
              <button onClick={menu.saveProduct} className="flex-1 bg-primary text-black font-bold py-2 rounded-lg text-sm hover:bg-primary/90 active:scale-95 transition-all">
                {menu.pEditId ? 'Guardar cambios' : 'Crear producto'}
              </button>
              {menu.pEditId && <button onClick={menu.cancelProduct} className="bg-white/5 text-white/50 px-3 py-2 rounded-lg text-sm hover:text-white">✕</button>}
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="font-semibold text-white text-sm mb-3">Tus Productos</h2>
          <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto overscroll-contain scrollbar-none">
            {menu.products.map((p: any) => {
              const catName = typeof p.category === 'object' ? p.category?.name : (menu.cats.find((c: any) => c._id === p.category)?.name ?? '—');
              
              // Blindaje para evitar que los fallbacks de la documentación rompan la consola
              const hasValidImage = p.image && (p.image.startsWith('http://') || p.image.startsWith('https://'));

              return (
                <div key={p._id} className="flex items-center gap-3 bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2.5">
                  {hasValidImage ? (
                    <img src={p.image} alt={p.title} className="w-9 h-9 rounded-lg object-cover shrink-0 bg-zinc-900" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/20 text-[10px] shrink-0">
                      🍣
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold truncate ${p.active ? 'text-white' : 'text-white/30 line-through'}`}>{p.title}</p>
                      {p.controlStock && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${(p.stock ?? 0) > 0 ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'}`}>{p.stock ?? 0}</span>}
                    </div>
                    <p className="text-[11px] text-white/30">{catName} · <span className="text-primary">${p.price?.toLocaleString('es-AR')}</span></p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => menu.editProduct(p)} className="text-white/20 hover:text-white text-xs transition-colors">✏</button>
                    <button onClick={() => menu.toggleProduct(p._id)} className={`text-xs transition-colors ${p.active ? 'text-white/20 hover:text-white' : 'text-green-400/50 hover:text-green-400'}`}>{p.active ? '◉' : '○'}</button>
                    <button onClick={() => menu.removeProduct(p._id)} className="text-white/20 hover:text-red-400 text-xs transition-colors">✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        </AdminCard>
      </div>
    </>
  );
}