'use client';

import { useState, useCallback, useEffect } from 'react';
import { fetchAdminCoupons, createCoupon, updateCoupon, deleteCoupon } from '@/services/admin.service';
import { PAYS, CDAYS } from '@/constants/admin';
import { useAdminCrud } from './useAdminCrud';

const BLANK = { code: '', discountPercent: '', active: true, validDays: [] as string[], validPaymentMethods: [] as string[] };

export function useAdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);

  const reload = useCallback(async () => {
    try { setCoupons(await fetchAdminCoupons()); } catch {}
  }, []);

  // 🚀 LA PIEZA FALTANTE: Ejecuta la carga inicial de los cupones al montar la pantalla
  useEffect(() => {
    reload();
  }, [reload]);

  const crud = useAdminCrud({
    blank: BLANK,
    create: createCoupon,
    update: updateCoupon,
    remove: deleteCoupon,
    reload,
    toPayload: (form) => ({ ...form, discountPercent: Number(form.discountPercent) }),
    fromItem: (c: any) => ({
      code: c.code,
      discountPercent: String(c.discountPercent),
      active: c.active,
      validDays: c.validDays ?? [],
      validPaymentMethods: c.validPaymentMethods ?? [],
    }),
  });

  const toggleArr = (field: 'validDays' | 'validPaymentMethods', val: string) =>
    crud.setForm(p => ({ ...p, [field]: p[field].includes(val) ? p[field].filter((v: string) => v !== val) : [...p[field], val] }));

  return {
    coupons,
    cpForm: crud.form, setCpForm: crud.setForm, cpEditId: crud.editId, cpErr: crud.err,
    save: crud.save, edit: crud.edit, remove: crud.remove, cancel: crud.cancel,
    toggleArr, reload, PAYS, CDAYS,
  };
}
