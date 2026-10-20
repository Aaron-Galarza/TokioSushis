'use client';

import { useEffect, useState } from 'react';
import { fetchAdminProducts, setProductStock, toggleProductActive } from '@/services/admin.service';

export function CashierMenuTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const reload = async () => {
    try { setProducts(await fetchAdminProducts()); }
    catch { setError('No se pudo cargar el menú.'); }
  };
  useEffect(() => { reload(); }, []);

  const act = async (id: string, action: () => Promise<unknown>) => {
    setBusy(id); setError('');
    try { await action(); await reload(); }
    catch { setError('No se pudo actualizar el producto.'); }
    finally { setBusy(null); }
  };

  return <section className="space-y-4">
    <div><h2 className="font-semibold text-lg">Menú operativo</h2>
      <p className="text-sm text-white/50">Podés cambiar disponibilidad y stock de los productos de tu sucursal.</p></div>
    {error && <p className="text-red-400 text-sm">{error}</p>}
    {products.map((p) => <div key={p._id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="min-w-0 flex-1"><p className="font-semibold">{p.title}</p><p className="text-sm text-white/50">${p.price?.toLocaleString('es-AR')}</p></div>
      {p.controlStock && <label className="flex items-center gap-2 text-sm">Stock
        <input aria-label={`Stock de ${p.title}`} type="number" min={0} defaultValue={p.stock} key={`${p._id}:${p.stock}`}
          onBlur={(event) => {
            const stock = Number(event.target.value);
            if (Number.isInteger(stock) && stock >= 0 && stock !== p.stock) {
              act(p._id, () => setProductStock(p._id, stock));
            }
          }} className="w-20 rounded bg-black/30 p-2" />
      </label>}
      <button disabled={busy === p._id} onClick={() => act(p._id, () => toggleProductActive(p._id))}
        className="rounded-lg border border-white/20 px-3 py-2 text-sm disabled:opacity-40">
        {p.active ? 'Desactivar' : 'Activar'}
      </button>
    </div>)}
  </section>;
}
