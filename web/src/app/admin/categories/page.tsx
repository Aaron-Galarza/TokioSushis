'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';

const BLANK = { name: '', order: '0', active: true };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({ ...BLANK });
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    const res = await api.get('/categories/admin');
    setCategories(res.data.data);
  };

  useEffect(() => { fetchCategories(); }, []);

  const save = async () => {
    setError('');
    try {
      const payload = { name: form.name, order: Number(form.order), active: form.active };
      if (editId) {
        await api.put(`/categories/admin/${editId}`, payload);
      } else {
        await api.post('/categories/admin', payload);
      }
      setForm({ ...BLANK });
      setEditId(null);
      fetchCategories();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al guardar');
    }
  };

  const startEdit = (c: any) => {
    setEditId(c._id);
    setForm({ name: c.name, order: String(c.order), active: c.active });
  };

  const toggle = async (id: string) => {
    await api.put(`/categories/admin/toggleActive/${id}`);
    fetchCategories();
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar categoría permanentemente?')) return;
    await api.delete(`/categories/admin/${id}`);
    fetchCategories();
  };

  const cancel = () => { setForm({ ...BLANK }); setEditId(null); setError(''); };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-xl font-bold text-white">Categorías</h1>

      {/* Form */}
      <div className="bg-[#161616] border border-white/10 rounded-xl p-4 flex flex-col gap-3">
        <h2 className="font-semibold text-white text-sm">{editId ? 'Editar categoría' : 'Nueva categoría'}</h2>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <div className="flex gap-2">
          <input
            placeholder="Nombre"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="flex-1 bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 outline-none focus:border-primary/50"
          />
          <input
            type="number"
            placeholder="Orden"
            value={form.order}
            onChange={e => setForm(f => ({ ...f, order: e.target.value }))}
            className="w-24 bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 outline-none focus:border-primary/50"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
          <input
            type="checkbox"
            checked={form.active}
            onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
          />
          Activa
        </label>
        <div className="flex gap-2">
          <button onClick={save} className="bg-primary text-black font-bold px-4 py-2 rounded-lg text-sm hover:bg-primary/90">
            {editId ? 'Guardar' : 'Crear'}
          </button>
          {editId && (
            <button onClick={cancel} className="bg-[#1A1A1A] text-white/60 px-4 py-2 rounded-lg text-sm hover:text-white">
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {categories.map(cat => (
          <div key={cat._id} className="bg-[#161616] border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className={`font-semibold text-sm ${cat.active ? 'text-white' : 'text-white/40 line-through'}`}>
                {cat.name}
              </p>
              <p className="text-white/40 text-xs">Orden: {cat.order}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toggle(cat._id)}
                className={`text-xs px-2 py-1 rounded-lg ${cat.active ? 'bg-white/5 text-white/60 hover:text-white' : 'bg-green-900 text-green-300 hover:bg-green-800'}`}
              >
                {cat.active ? 'Desactivar' : 'Activar'}
              </button>
              <button onClick={() => startEdit(cat)} className="text-xs text-white/50 hover:text-white px-2 py-1 bg-[#1A1A1A] rounded-lg">
                Editar
              </button>
              <button onClick={() => remove(cat._id)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 bg-[#1A1A1A] rounded-lg">
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
