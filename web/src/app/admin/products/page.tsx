'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';

const BLANK = { title: '', price: '', description: '', image: '', category: '', active: true };

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({ ...BLANK });
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchAll = async () => {
    const [pRes, cRes] = await Promise.all([
      api.get('/products/admin'),
      api.get('/categories/admin'),
    ]);
    setProducts(pRes.data.data);
    setCategories(cRes.data.data);
  };

  useEffect(() => { fetchAll(); }, []);

  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  const save = async () => {
    setError('');
    try {
      const payload: Record<string, any> = {
        title: form.title,
        price: Number(form.price),
        description: form.description,
        category: form.category,
        active: form.active,
      };
      if (form.image.trim()) payload.image = form.image.trim();
      if (editId) {
        await api.put(`/products/admin/${editId}`, payload);
      } else {
        await api.post('/products/admin', payload);
      }
      setForm({ ...BLANK });
      setEditId(null);
      fetchAll();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al guardar');
    }
  };

  const startEdit = (p: any) => {
    setEditId(p._id);
    setForm({
      title: p.title,
      price: String(p.price),
      description: p.description,
      image: p.image || '',
      category: typeof p.category === 'object' ? p.category._id : p.category,
      active: p.active,
    });
  };

  const toggle = async (id: string) => {
    await api.put(`/products/admin/toggleActive/${id}`);
    fetchAll();
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar producto permanentemente?')) return;
    await api.delete(`/products/admin/${id}`);
    fetchAll();
  };

  const cancel = () => { setForm({ ...BLANK }); setEditId(null); setError(''); };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-white">Productos</h1>

      {/* Form */}
      <div className="bg-[#161616] border border-white/10 rounded-xl p-4 flex flex-col gap-3 max-w-2xl">
        <h2 className="font-semibold text-white text-sm">{editId ? 'Editar producto' : 'Nuevo producto'}</h2>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <input
          placeholder="Título"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          className="bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 outline-none focus:border-primary/50"
        />
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            placeholder="Precio"
            value={form.price}
            onChange={e => set('price', e.target.value)}
            className="w-32 bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 outline-none focus:border-primary/50"
          />
          <select
            value={form.category}
            onChange={e => set('category', e.target.value)}
            className="flex-1 bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="">Seleccionar categoría</option>
            {categories.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
        <textarea
          placeholder="Descripción"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={2}
          className="bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 resize-none outline-none focus:border-primary/50"
        />
        <input
          placeholder="URL de imagen (opcional)"
          value={form.image}
          onChange={e => set('image', e.target.value)}
          className="bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 outline-none focus:border-primary/50"
        />
        <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
          <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} />
          Activo
        </label>
        <div className="flex gap-2">
          <button onClick={save} className="bg-primary text-black font-bold px-4 py-2 rounded-lg text-sm hover:bg-primary/90">
            {editId ? 'Guardar cambios' : 'Crear producto'}
          </button>
          {editId && (
            <button onClick={cancel} className="bg-[#1A1A1A] text-white/60 px-4 py-2 rounded-lg text-sm hover:text-white">
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2 max-w-3xl">
        {products.map(p => {
          const catName =
            typeof p.category === 'object'
              ? p.category?.name
              : (categories.find(c => c._id === p.category)?.name ?? '—');
          return (
            <div key={p._id} className="bg-[#161616] border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className={`font-semibold text-sm ${p.active ? 'text-white' : 'text-white/40 line-through'}`}>
                  {p.title}
                </p>
                <p className="text-white/40 text-xs">
                  ${p.price?.toLocaleString('es-AR')} · {catName}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <button
                  onClick={() => toggle(p._id)}
                  className={`text-xs px-2 py-1 rounded-lg ${p.active ? 'bg-white/5 text-white/60 hover:text-white' : 'bg-green-900 text-green-300 hover:bg-green-800'}`}
                >
                  {p.active ? 'Desactivar' : 'Activar'}
                </button>
                <button onClick={() => startEdit(p)} className="text-xs text-white/50 hover:text-white px-2 py-1 bg-[#1A1A1A] rounded-lg">
                  Editar
                </button>
                <button onClick={() => remove(p._id)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 bg-[#1A1A1A] rounded-lg">
                  Borrar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
