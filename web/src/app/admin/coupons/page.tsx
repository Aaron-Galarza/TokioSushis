'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';

const DAYS_OPTIONS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const PAYMENT_OPTIONS = ['cash', 'transfer', 'mercadopago'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié', thursday: 'Jue',
  friday: 'Vie', saturday: 'Sáb', sunday: 'Dom',
};

const BLANK = {
  code: '',
  discountPercent: '',
  active: true,
  validDays: [] as string[],
  validPaymentMethods: [] as string[],
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [form, setForm] = useState({ ...BLANK });
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchCoupons = async () => {
    const res = await api.get('/coupons/admin');
    setCoupons(res.data.data);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const toggleArr = (field: 'validDays' | 'validPaymentMethods', val: string) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(val)
        ? prev[field].filter(v => v !== val)
        : [...prev[field], val],
    }));
  };

  const save = async () => {
    setError('');
    try {
      const payload = { ...form, discountPercent: Number(form.discountPercent) };
      if (editId) {
        await api.put(`/coupons/admin/${editId}`, payload);
      } else {
        await api.post('/coupons/admin', payload);
      }
      setForm({ ...BLANK });
      setEditId(null);
      fetchCoupons();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al guardar');
    }
  };

  const startEdit = (c: any) => {
    setEditId(c._id);
    setForm({
      code: c.code,
      discountPercent: String(c.discountPercent),
      active: c.active,
      validDays: c.validDays ?? [],
      validPaymentMethods: c.validPaymentMethods ?? [],
    });
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar cupón?')) return;
    await api.delete(`/coupons/admin/${id}`);
    fetchCoupons();
  };

  const cancel = () => { setForm({ ...BLANK }); setEditId(null); setError(''); };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-xl font-bold text-white">Cupones</h1>

      {/* Form */}
      <div className="bg-[#161616] border border-white/10 rounded-xl p-4 flex flex-col gap-3">
        <h2 className="font-semibold text-white text-sm">{editId ? 'Editar cupón' : 'Nuevo cupón'}</h2>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <div className="flex gap-2">
          <input
            placeholder="CÓDIGO"
            value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
            className="flex-1 bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 outline-none focus:border-primary/50"
          />
          <input
            type="number"
            placeholder="% descuento"
            value={form.discountPercent}
            onChange={e => setForm(f => ({ ...f, discountPercent: e.target.value }))}
            className="w-28 bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 outline-none focus:border-primary/50"
          />
        </div>

        <div>
          <p className="text-white/40 text-xs mb-1.5">Días válidos (vacío = todos)</p>
          <div className="flex flex-wrap gap-1.5">
            {DAYS_OPTIONS.map(d => (
              <button
                key={d}
                onClick={() => toggleArr('validDays', d)}
                className={`px-2 py-1 rounded text-xs font-medium ${form.validDays.includes(d) ? 'bg-primary text-black' : 'bg-[#1A1A1A] text-white/50 hover:text-white'}`}
              >
                {DAY_LABELS[d]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-white/40 text-xs mb-1.5">Métodos de pago válidos (vacío = todos)</p>
          <div className="flex gap-1.5">
            {PAYMENT_OPTIONS.map(p => (
              <button
                key={p}
                onClick={() => toggleArr('validPaymentMethods', p)}
                className={`px-2 py-1 rounded text-xs font-medium ${form.validPaymentMethods.includes(p) ? 'bg-primary text-black' : 'bg-[#1A1A1A] text-white/50 hover:text-white'}`}
              >
                {p}
              </button>
            ))}
          </div>
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
            {editId ? 'Guardar cambios' : 'Crear cupón'}
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
        {coupons.map(c => (
          <div key={c._id} className="bg-[#161616] border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-white text-sm">
                {c.code} — {c.discountPercent}%
                {!c.active && <span className="ml-2 text-white/40 font-normal text-xs">(inactivo)</span>}
              </p>
              <p className="text-white/40 text-xs">
                {c.validDays?.length
                  ? `Días: ${c.validDays.map((d: string) => DAY_LABELS[d] || d).join(', ')}`
                  : 'Todos los días'}
                {' · '}
                {c.validPaymentMethods?.length
                  ? `Métodos: ${c.validPaymentMethods.join(', ')}`
                  : 'Todos los métodos'}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(c)} className="text-xs text-white/50 hover:text-white px-2 py-1 bg-[#1A1A1A] rounded-lg">
                Editar
              </button>
              <button onClick={() => remove(c._id)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 bg-[#1A1A1A] rounded-lg">
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
