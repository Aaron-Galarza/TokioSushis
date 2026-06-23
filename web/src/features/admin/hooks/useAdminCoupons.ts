'use client';

import { useState, useCallback } from 'react';
import { fetchAdminCoupons, createCoupon, updateCoupon, deleteCoupon } from '@/services/admin.service';
import { PAYS, CDAYS } from '@/constants/admin';

const BLANK = { code: '', discountPercent: '', active: true, validDays: [] as string[], validPaymentMethods: [] as string[] };

export function useAdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [cpForm, setCpForm] = useState({ ...BLANK });
  const [cpEditId, setCpEditId] = useState<string | null>(null);
  const [cpErr, setCpErr] = useState('');

  const reload = useCallback(async () => {
    try { setCoupons(await fetchAdminCoupons()); } catch {}
  }, []);

  const save = async () => {
    setCpErr('');
    try {
      const pl = { ...cpForm, discountPercent: Number(cpForm.discountPercent) };
      if (cpEditId) await updateCoupon(cpEditId, pl); else await createCoupon(pl);
      setCpForm({ ...BLANK }); setCpEditId(null); reload();
    } catch (e: any) { setCpErr(e.response?.data?.error || 'Error al guardar'); }
  };

  const edit = (c: any) => {
    setCpEditId(c._id);
    setCpForm({ code: c.code, discountPercent: String(c.discountPercent), active: c.active, validDays: c.validDays ?? [], validPaymentMethods: c.validPaymentMethods ?? [] });
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar?')) return;
    await deleteCoupon(id); reload();
  };

  const cancel = () => { setCpForm({ ...BLANK }); setCpEditId(null); setCpErr(''); };

  const toggleArr = (field: 'validDays' | 'validPaymentMethods', val: string) =>
    setCpForm(p => ({ ...p, [field]: p[field].includes(val) ? p[field].filter(v => v !== val) : [...p[field], val] }));

  return { coupons, cpForm, setCpForm, cpEditId, cpErr, save, edit, remove, cancel, toggleArr, reload, PAYS, CDAYS };
}
