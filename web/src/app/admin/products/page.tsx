'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, Pencil, X, Tag } from 'lucide-react';
import api from '@/services/api';

const BLANK = { title: '', price: '', description: '', image: '', category: '' };

const inputCls =
  'w-full bg-[#0A0A0A] text-white px-4 py-3 rounded-lg border border-[#2A2A2A] focus:outline-none focus:border-primary text-sm placeholder:text-muted-foreground';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({ ...BLANK });
  const [editId, setEditId] = useState<string | null>(null);
  const [productError, setProductError] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [catError, setCatError] = useState('');

  const fetchAll = async () => {
    const [pRes, cRes] = await Promise.all([
      api.get('/products/admin'),
      api.get('/categories/admin'),
    ]);
    setProducts(pRes.data.data);
    setCategories(cRes.data.data);
  };

  useEffect(() => { fetchAll(); }, []);

  const setField = (field: string, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  const saveProduct = async () => {
    setProductError('');
    try {
      const payload: Record<string, any> = {
        title: form.title,
        price: Number(form.price),
        description: form.description,
        category: form.category,
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
      setProductError(e.response?.data?.error || 'Error al guardar el producto');
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
    });
  };

  const toggleProduct = async (id: string) => {
    await api.put(`/products/admin/toggleActive/${id}`);
    fetchAll();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('¿Eliminar producto permanentemente?')) return;
    await api.delete(`/products/admin/${id}`);
    fetchAll();
  };

  const createCategory = async () => {
    setCatError('');
    if (!newCatName.trim()) return;
    try {
      await api.post('/categories/admin', { name: newCatName.trim() });
      setNewCatName('');
      fetchAll();
    } catch (e: any) {
      setCatError(e.response?.data?.error || 'Error al crear la categoría');
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('¿Eliminar categoría?')) return;
    await api.delete(`/categories/admin/${id}`);
    fetchAll();
  };

  const cancelEdit = () => { setForm({ ...BLANK }); setEditId(null); setProductError(''); };

  return (
    <div className="grid md:grid-cols-[1fr_1.2fr] gap-6 items-start">

      {/* ─── LEFT ───────────────────────────────────────────────── */}
      <div className="space-y-5">

        {/* Categorías */}
        <div className="bg-[#161616] rounded-xl p-6 border border-[#2A2A2A]">
          <h2 className="text-white text-xl mb-4">Categorías</h2>
          <div className="flex gap-2 mb-3">
            <input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createCategory()}
              placeholder="Nueva categoría"
              className="flex-1 bg-[#0A0A0A] text-white px-4 py-2.5 rounded-lg border border-[#2A2A2A] focus:outline-none focus:border-primary text-sm placeholder:text-muted-foreground"
            />
            <button
              onClick={createCategory}
              className="flex items-center gap-1.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-4 py-2 rounded-lg text-sm transition-all font-semibold whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Crear
            </button>
          </div>
          {catError && <p className="text-red-400 text-xs mb-3">{catError}</p>}
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <div
                key={c._id}
                className="flex items-center gap-1.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-1.5"
              >
                <Tag className="w-3 h-3 text-primary" />
                <span className="text-white text-sm">{c.name}</span>
                <button
                  onClick={() => deleteCategory(c._id)}
                  className="text-muted-foreground hover:text-red-400 transition-colors ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-[#161616] rounded-xl p-6 border border-[#2A2A2A]">
          <h2 className="text-white text-xl mb-4">
            {editId ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          {productError && <p className="text-red-400 text-xs mb-3">{productError}</p>}
          <div className="space-y-3">
            <input
              placeholder="Nombre del producto"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              className={inputCls}
            />
            <textarea
              placeholder="Descripción/Ingredientes"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
            />
            <select
              value={form.category}
              onChange={(e) => setField('category', e.target.value)}
              className={inputCls}
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Precio"
              value={form.price}
              onChange={(e) => setField('price', e.target.value)}
              min={0}
              className={inputCls}
            />
            <input
              placeholder="URL de la imagen"
              value={form.image}
              onChange={(e) => setField('image', e.target.value)}
              className={inputCls}
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={saveProduct}
                className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-black py-3 rounded-lg transition-all font-semibold text-sm"
              >
                <Plus className="w-4 h-4" />
                {editId ? 'Guardar cambios' : 'Crear Producto'}
              </button>
              {editId && (
                <button
                  onClick={cancelEdit}
                  className="px-4 py-3 rounded-lg bg-[#2A2A2A] hover:bg-[#333] text-muted-foreground text-sm transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT: Product list ─────────────────────────────────── */}
      <div className="bg-[#161616] rounded-xl p-6 border border-[#2A2A2A]">
        <h2 className="text-white text-xl mb-4">Tus Productos</h2>
        <div className="space-y-2">
          {products.map((p) => {
            const catName =
              typeof p.category === 'object'
                ? p.category?.name
                : (categories.find((c) => c._id === p.category)?.name ?? '—');
            const imgSrc =
              typeof p.image === 'string' && p.image.startsWith('http')
                ? p.image
                : null;

            return (
              <div
                key={p._id}
                className={`flex items-center gap-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 transition-all ${!p.active ? 'opacity-50' : ''}`}
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg bg-[#2A2A2A] overflow-hidden shrink-0">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg">
                      📷
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{p.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {catName} · ${p.price?.toLocaleString('es-AR')}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => toggleProduct(p._id)}
                    className={`p-2 rounded-lg transition-all ${
                      p.active
                        ? 'text-green-400 hover:bg-green-400/10'
                        : 'text-muted-foreground hover:text-green-400 hover:bg-green-400/10'
                    }`}
                    title={p.active ? 'Desactivar' : 'Activar'}
                  >
                    {p.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => startEdit(p)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-white transition-all"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteProduct(p._id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-red-400 transition-all"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {products.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-8">
              No hay productos cargados aún
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
