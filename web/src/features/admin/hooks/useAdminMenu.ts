'use client';
import { useState, useCallback } from 'react';
import {
  fetchAdminProducts, createProduct, updateProduct, toggleProductActive, deleteProduct,
  fetchAdminCategories, createCategory, updateCategory, toggleCategoryActive, deleteCategory,
  fetchAdminAddons, createAddon, updateAddon, toggleAddonActive, deleteAddon,
} from '@/services/admin.service';
import { useAdminCrud } from './useAdminCrud';

const PBLANK = {
  title: '', price: '', description: '', image: '',
  category: '', active: true, controlStock: false, stock: '0',
};
const ABLANK = { title: '', price: '', categories: [] as string[], active: true };
const CBLANK = { name: '', order: '0', active: true, icon: '' };

export function useAdminMenu() {
  const [products, setProducts] = useState<any[]>([]);
  const [cats, setCats]         = useState<any[]>([]);
  const [addons, setAddons]     = useState<any[]>([]);

  const reload = useCallback(async () => {
    try {
      const [p, c, a] = await Promise.all([
        fetchAdminProducts(),
        fetchAdminCategories(),
        fetchAdminAddons(),
      ]);
      setProducts(p); setCats(c); setAddons(a);
    } catch {}
  }, []);

  // ── Products ────────────────────────────────────────────────────────────────
  const productCrud = useAdminCrud({
    blank: PBLANK,
    create: createProduct,
    update: updateProduct,
    remove: deleteProduct,
    toggle: toggleProductActive,
    reload,
    toPayload: (form) => {
      const pl: any = {
        title: form.title, price: Number(form.price),
        description: form.description, category: form.category,
        active: form.active, controlStock: form.controlStock,
      };
      if (form.controlStock) pl.stock = Number(form.stock);
      if (form.image.trim()) pl.image = form.image.trim();
      return pl;
    },
    fromItem: (p: any) => ({
      title: p.title, price: String(p.price), description: p.description,
      image: p.image || '',
      category: typeof p.category === 'object' ? p.category._id : p.category,
      active: p.active, controlStock: p.controlStock ?? false, stock: String(p.stock ?? 0),
    }),
  });

  // ── Categories ──────────────────────────────────────────────────────────────
  const catCrud = useAdminCrud({
    blank: CBLANK,
    create: createCategory,
    update: updateCategory,
    remove: deleteCategory,
    toggle: toggleCategoryActive,
    reload,
    toPayload: (form) => ({ name: form.name, order: Number(form.order), active: form.active, icon: form.icon }),
    fromItem: (c: any) => ({ name: c.name, order: String(c.order), active: c.active, icon: c.icon || '' }),
  });

  // ── Addons ──────────────────────────────────────────────────────────────────
  const addonCrud = useAdminCrud({
    blank: ABLANK,
    create: createAddon,
    update: updateAddon,
    remove: deleteAddon,
    toggle: toggleAddonActive,
    reload,
    toPayload: (form) => ({ title: form.title, price: Number(form.price), active: form.active, categories: form.categories }),
    fromItem: (a: any) => ({
      title: a.title || a.name,
      price: String(a.price),
      active: a.active,
      categories: (a.categories ?? []).map((c: any) => (typeof c === 'object' ? c._id : c)),
    }),
  });

  return {
    products, cats, addons, reload,
    pForm: productCrud.form, setPForm: productCrud.setForm, pEditId: productCrud.editId, pErr: productCrud.err,
    saveProduct: productCrud.save, editProduct: productCrud.edit, toggleProduct: productCrud.toggle, removeProduct: productCrud.remove, cancelProduct: productCrud.cancel,
    cForm: catCrud.form, setCForm: catCrud.setForm, cEditId: catCrud.editId,
    saveCat: catCrud.save, editCat: catCrud.edit, toggleCat: catCrud.toggle, removeCat: catCrud.remove, cancelCat: catCrud.cancel,
    aForm: addonCrud.form, setAForm: addonCrud.setForm, aEditId: addonCrud.editId,
    saveAddon: addonCrud.save, editAddon: addonCrud.edit, toggleAddon: addonCrud.toggle, removeAddon: addonCrud.remove, cancelAddon: addonCrud.cancel,
  };
}
