'use client';

import { useState } from 'react';

interface UseAdminCrudOptions<TForm, TItem> {
  blank: TForm;
  create: (payload: any) => Promise<any>;
  update: (id: string, payload: any) => Promise<any>;
  remove: (id: string) => Promise<any>;
  toggle?: (id: string) => Promise<any>;
  reload: () => Promise<void>;
  /** Transforma el form-state al payload que espera la API. Por defecto, se manda el form tal cual. */
  toPayload?: (form: TForm) => any;
  /** Mapea un item recibido del server al shape del form, para precargar el formulario al editar. */
  fromItem: (item: TItem) => TForm;
  /** Por defecto usa item._id. */
  getId?: (item: TItem) => string;
}

/**
 * Generaliza el patrón "form + editId + err" repetido en los hooks admin
 * (guardar crea o actualiza según haya editId, editar precarga el form,
 * eliminar confirma y recarga, cancelar resetea).
 */
export function useAdminCrud<TForm, TItem = any>(opts: UseAdminCrudOptions<TForm, TItem>) {
  const [form, setForm] = useState<TForm>(opts.blank);
  const [editId, setEditId] = useState<string | null>(null);
  const [err, setErr] = useState('');

  const save = async () => {
    setErr('');
    try {
      const payload = opts.toPayload ? opts.toPayload(form) : form;
      if (editId) await opts.update(editId, payload);
      else await opts.create(payload);
      setForm(opts.blank);
      setEditId(null);
      await opts.reload();
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Error al guardar');
    }
  };

  const edit = (item: TItem) => {
    setEditId((opts.getId ?? ((i: any) => i._id))(item));
    setForm(opts.fromItem(item));
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar?')) return;
    await opts.remove(id);
    await opts.reload();
  };

  const toggle = async (id: string) => {
    if (!opts.toggle) return;
    await opts.toggle(id);
    await opts.reload();
  };

  const cancel = () => {
    setForm(opts.blank);
    setEditId(null);
    setErr('');
  };

  return { form, setForm, editId, err, save, edit, remove, toggle, cancel };
}
