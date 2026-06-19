'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';

const BLANK = { title: '', price: '', active: true };

export default function AddonsPage() {
  const [addons, setAddons] = useState<any[]>([]);
  const [form, setForm] = useState({ ...BLANK });
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchAddons = async () => {
    const res = await api.get('/addons/admin');
    setAddons(res.data.data);
  };

  useEffect(() => { fetchAddons(); }, []);

  const save = async () => {
    setError('');
    try {
      const payload = { title: form.title, price: Number(form.price), active: form.active };
      if (editId) {
        await api.put(`/addons/admin/${editId}`, payload);
      } else {
        await api.post('/addons/admin', payload);
      }
      setForm({ ...BLANK });
      setEditId(null);
      fetchAddons();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al guardar');
    }
  };

  const startEdit = (a: any) => {
    setEditId(a._id);
    setForm({ title: a.title || a.name, price: String(a.price), active: a.active });
  };

  const toggle = async (id: string) => {
    await api.put(`/addons/admin/toggleActive/${id}`);
    fetchAddons();
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar adicional permanentemente?')) return;
    await api.delete(`/addons/admin/${id}`);
    fetchAddons();
  };

  const cancel = () => { setForm({ ...BLANK }); setEditId(null); setError(''); };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-xl font-bold text-white">Adicionales</h1>

      {/* Form */}
      <div className="bg-[#161616] border border-white/10 rounded-xl p-4 flex flex-col gap-3">
        <h2 className="font-semibold text-white text-sm">{editId ? 'Editar adicional' : 'Nuevo adicional'}</h2>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <div className="flex gap-2">
          <input
            placeholder="Nombre"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="flex-1 bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 outline-none focus:border-primary/50"
          />
          <input
            type="number"
            min="0"
            placeholder="Precio"
            value={form.price}
            onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
            className="w-28 bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 outline-none focus:border-primary/50"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
          <input
            type="checkbox"
            checked={form.active}
            onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
          />
          Activo
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
        {addons.map(a => (
          <div key={a._id} className="bg-[#161616] border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <p className={`font-semibold text-sm ${a.active ? 'text-white' : 'text-white/40 line-through'}`}>
              {a.title || a.name} — ${a.price.toLocaleString('es-AR')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => toggle(a._id)}
                className={`text-xs px-2 py-1 rounded-lg ${a.active ? 'bg-white/5 text-white/60 hover:text-white' : 'bg-green-900 text-green-300 hover:bg-green-800'}`}
              >
                {a.active ? 'Desactivar' : 'Activar'}
              </button>
              <button onClick={() => startEdit(a)} className="text-xs text-white/50 hover:text-white px-2 py-1 bg-[#1A1A1A] rounded-lg">
                Editar
              </button>
              <button onClick={() => remove(a._id)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 bg-[#1A1A1A] rounded-lg">
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
