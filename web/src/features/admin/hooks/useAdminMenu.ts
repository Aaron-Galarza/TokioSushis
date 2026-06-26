'use client';
import { useState, useCallback } from 'react';
import {
  fetchAdminProducts, createProduct, updateProduct, toggleProductActive, deleteProduct,
  fetchAdminCategories, createCategory, updateCategory, toggleCategoryActive, deleteCategory,
  fetchAdminAddons, createAddon, updateAddon, toggleAddonActive, deleteAddon,
} from '@/services/admin.service';

const PBLANK = {
  title: '', price: '', description: '', image: '',
  category: '', active: true, controlStock: false, stock: '0',
};

// categories es un array de _id (strings) para el multi-select
const ABLANK = { title: '', price: '', categories: [] as string[], active: true };

export function useAdminMenu() {
  const [products, setProducts] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);

  const [pForm, setPForm] = useState({ ...PBLANK });
  const [pEditId, setPEditId] = useState<string | null>(null);
  const [pErr, setPErr] = useState('');

  const [cForm, setCForm] = useState({ name: '', order: '0', active: true });
  const [cEditId, setCEditId] = useState<string | null>(null);

  const [aForm, setAForm] = useState({ ...ABLANK });
  const [aEditId, setAEditId] = useState<string | null>(null);

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
  const saveProduct = async () => {
    setPErr('');
    try {
      const pl: any = {
        title: pForm.title,
        price: Number(pForm.price),
        description: pForm.description,
        category: pForm.category,
        active: pForm.active,
        controlStock: pForm.controlStock,
      };
      if (pForm.controlStock) pl.stock = Number(pForm.stock);
      if (pForm.image.trim()) pl.image = pForm.image.trim();
      if (pEditId) await updateProduct(pEditId, pl); else await createProduct(pl);
      setPForm({ ...PBLANK }); setPEditId(null); reload();
    } catch (e: any) { setPErr(e.response?.data?.error || 'Error al guardar'); }
  };

  const editProduct = (p: any) => {
    setPEditId(p._id);
    setPForm({
      title: p.title, price: String(p.price), description: p.description,
      image: p.image || '',
      category: typeof p.category === 'object' ? p.category._id : p.category,
      active: p.active, controlStock: p.controlStock ?? false, stock: String(p.stock ?? 0),
    });
  };
  const toggleProduct  = async (id: string) => { await toggleProductActive(id); reload(); };
  const removeProduct  = async (id: string) => { if (!confirm('¿Eliminar?')) return; await deleteProduct(id); reload(); };
  const cancelProduct  = () => { setPForm({ ...PBLANK }); setPEditId(null); setPErr(''); };

  // ── Categories ──────────────────────────────────────────────────────────────
  const saveCat = async () => {
    try {
      const pl = { name: cForm.name, order: Number(cForm.order), active: cForm.active };
      if (cEditId) await updateCategory(cEditId, pl); else await createCategory(pl);
      setCForm({ name: '', order: '0', active: true }); setCEditId(null); reload();
    } catch {}
  };
  const editCat    = (c: any) => { setCEditId(c._id); setCForm({ name: c.name, order: String(c.order), active: c.active }); };
  const toggleCat  = async (id: string) => { await toggleCategoryActive(id); reload(); };
  const removeCat  = async (id: string) => { if (!confirm('¿Eliminar?')) return; await deleteCategory(id); reload(); };
  const cancelCat  = () => { setCForm({ name: '', order: '0', active: true }); setCEditId(null); };

  // ── Addons ──────────────────────────────────────────────────────────────────
  const saveAddon = async () => {
    try {
      const pl: Record<string, any> = {
        title: aForm.title,
        price: Number(aForm.price),
        active: aForm.active,
        // Siempre mandamos el array. Si está vacío el backend lo interpreta
        // como "aplica a todas las categorías" (ver viewByCategory con $size: 0)
        categories: aForm.categories,
      };
      if (aEditId) await updateAddon(aEditId, pl); else await createAddon(pl);
      setAForm({ ...ABLANK }); setAEditId(null); reload();
    } catch {}
  };

  const editAddon = (a: any) => {
    setAEditId(a._id);
    // a.categories puede venir como array de ObjectId strings o de objetos populados
    const catIds: string[] = (a.categories ?? []).map((c: any) =>
      typeof c === 'object' ? c._id : c
    );
    setAForm({
      title: a.title || a.name,
      price: String(a.price),
      categories: catIds,
      active: a.active,
    });
  };

  const toggleAddon = async (id: string) => { await toggleAddonActive(id); reload(); };
  const removeAddon = async (id: string) => { if (!confirm('¿Eliminar?')) return; await deleteAddon(id); reload(); };
  const cancelAddon = () => { setAForm({ ...ABLANK }); setAEditId(null); };

  return {
    products, cats, addons, reload,
    pForm, setPForm, pEditId, pErr, saveProduct, editProduct, toggleProduct, removeProduct, cancelProduct,
    cForm, setCForm, cEditId, saveCat, editCat, toggleCat, removeCat, cancelCat,
    aForm, setAForm, aEditId, saveAddon, editAddon, toggleAddon, removeAddon, cancelAddon,
  };
}