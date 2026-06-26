'use client';

import { useState, useEffect } from 'react';
import { Plus, Minus, X, ShoppingBag, Loader2, ChevronDown } from 'lucide-react';
import { AddressAutocomplete } from '@/features/checkout/components/AddressAutocomplete';
import { deliveryService } from '@/services/delivery.service';
import { createAdminOrder } from '@/services/admin.service';
import type { AddressResult } from '@/features/checkout/hooks/useAddressSearch';

interface LineItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  addons: { addonId: string; title: string; price: number; quantity: number }[];
}

interface Props {
  products: any[];
  addons: any[];
  onSuccess: () => void;
}

const BLANK_CUSTOMER = { name: '', phone: '' };

export function QuickOrderForm({ products, addons, onSuccess }: Props) {
  const [open, setOpen]                   = useState(false);
  const [customer, setCustomer]           = useState(BLANK_CUSTOMER);
  const [deliveryType, setDeliveryType]   = useState<'pickup' | 'delivery'>('pickup');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [address, setAddress]             = useState('');
  const [coords, setCoords]               = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryCost, setDeliveryCost]   = useState(0);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [items, setItems]                 = useState<LineItem[]>([]);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  // Calcular costo de envío cuando cambian las coordenadas
  useEffect(() => {
    if (deliveryType !== 'delivery' || !coords) {
      setDeliveryCost(0);
      setDeliveryError(null);
      return;
    }
    const calculate = async () => {
      setDeliveryLoading(true);
      setDeliveryError(null);
      const res = await deliveryService.calculateDeliveryCost(coords.lat, coords.lng);
      if (res.success && res.data) {
        setDeliveryCost(res.data.deliveryCost);
      } else {
        setDeliveryError(res.error || 'No se pudo calcular el envío');
        setDeliveryCost(0);
      }
      setDeliveryLoading(false);
    };
    calculate();
  }, [coords, deliveryType]);

  // Agregar producto a la lista
  const addProduct = (productId: string) => {
    const prod = products.find((p: any) => p._id === productId);
    if (!prod) return;
    const exists = items.find(i => i.productId === productId);
    if (exists) {
      setItems(items.map(i =>
        i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setItems([...items, {
        productId: prod._id,
        title: prod.title,
        price: prod.price,
        quantity: 1,
        addons: [],
      }]);
    }
  };

  const updateQty = (productId: string, delta: number) => {
    setItems(prev =>
      prev
        .map(i => i.productId === productId ? { ...i, quantity: i.quantity + delta } : i)
        .filter(i => i.quantity > 0)
    );
  };

  const toggleAddon = (productId: string, addon: any) => {
    setItems(prev => prev.map(item => {
      if (item.productId !== productId) return item;
      const exists = item.addons.find(a => a.addonId === addon._id);
      if (exists) {
        return { ...item, addons: item.addons.filter(a => a.addonId !== addon._id) };
      }
      return {
        ...item,
        addons: [...item.addons, { addonId: addon._id, title: addon.title, price: addon.price, quantity: 1 }],
      };
    }));
  };

  const subtotal = items.reduce((sum, i) => {
    const addonsTotal = i.addons.reduce((s, a) => s + a.price * a.quantity, 0);
    return sum + (i.price + addonsTotal) * i.quantity;
  }, 0);

  const total = subtotal + deliveryCost;

  const reset = () => {
    setCustomer(BLANK_CUSTOMER);
    setDeliveryType('pickup');
    setPaymentMethod('cash');
    setAddress('');
    setCoords(null);
    setDeliveryCost(0);
    setItems([]);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!customer.name || !customer.phone) {
      setError('Nombre y teléfono son obligatorios');
      return;
    }
    if (items.length === 0) {
      setError('Agregá al menos un producto');
      return;
    }
    if (deliveryType === 'delivery' && !coords) {
      setError('Seleccioná una dirección válida para el delivery');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createAdminOrder({
        customer: {
          name: customer.name,
          phone: customer.phone,
          address: deliveryType === 'delivery' ? address : undefined,
        },
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          addons: i.addons.map(a => ({ addonId: a.addonId, quantity: a.quantity })),
        })),
        deliveryType,
        paymentMethod,
        ...(deliveryType === 'delivery' && coords ? {
          delivery: { address, coordinates: coords },
        } : {}),
      });
      reset();
      setOpen(false);
      onSuccess();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error al crear el pedido');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 text-sm font-semibold transition-all active:scale-95"
      >
        <ShoppingBag className="w-4 h-4" />
        Nuevo pedido manual
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">

          {/* Cliente */}
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Nombre del cliente *"
              value={customer.name}
              onChange={e => setCustomer(p => ({ ...p, name: e.target.value }))}
              className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
            />
            <input
              placeholder="Teléfono *"
              value={customer.phone}
              onChange={e => setCustomer(p => ({ ...p, phone: e.target.value }))}
              className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Delivery / Pickup + Pago */}
          <div className="flex gap-2 flex-wrap">
            <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs font-semibold">
              {(['pickup', 'delivery'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setDeliveryType(t); setCoords(null); setAddress(''); setDeliveryCost(0); }}
                  className={`px-3 py-2 transition-all ${deliveryType === t ? 'bg-primary text-black' : 'bg-[#111] text-white/40 hover:text-white'}`}
                >
                  {t === 'pickup' ? 'Retiro' : 'Delivery'}
                </button>
              ))}
            </div>
            <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs font-semibold">
              {([['cash', 'Efectivo'], ['transfer', 'Transferencia']] as const).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setPaymentMethod(v)}
                  className={`px-3 py-2 transition-all ${paymentMethod === v ? 'bg-primary text-black' : 'bg-[#111] text-white/40 hover:text-white'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Dirección (solo delivery) */}
          {deliveryType === 'delivery' && (
            <div>
              <AddressAutocomplete
                value={address}
                onChange={(r: AddressResult) => { setAddress(r.placeName); setCoords({ lat: r.lat, lng: r.lng }); }}
                onClear={() => { setAddress(''); setCoords(null); setDeliveryCost(0); }}
                placeholder="Dirección de entrega"
              />
              {deliveryLoading && (
                <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Calculando envío...
                </p>
              )}
              {deliveryError && <p className="text-xs text-red-400 mt-1">{deliveryError}</p>}
              {deliveryCost > 0 && !deliveryLoading && (
                <p className="text-xs text-primary mt-1">
                  Costo de envío: ${deliveryCost.toLocaleString('es-AR')}
                </p>
              )}
            </div>
          )}

          {/* Selector de productos */}
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Productos</p>
            <select
              onChange={e => { if (e.target.value) { addProduct(e.target.value); e.target.value = ''; } }}
              className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
              defaultValue=""
            >
              <option value="" disabled>+ Agregar producto</option>
              {products.filter((p: any) => p.active).map((p: any) => (
                <option key={p._id} value={p._id}>
                  {p.title} — ${p.price?.toLocaleString('es-AR')}
                </option>
              ))}
            </select>
          </div>

          {/* Lista de items */}
          {items.length > 0 && (
            <div className="space-y-2">
              {items.map(item => {
                // Adicionales aplicables a este producto
                const applicableAddons = addons.filter((a: any) =>
                  a.active && (
                    !a.categories?.length ||
                    a.categories.some((c: any) => {
                      const catId = typeof c === 'object' ? c._id : c;
                      const prod  = products.find((p: any) => p._id === item.productId);
                      const prodCat = typeof prod?.category === 'object' ? prod?.category?._id : prod?.category;
                      return catId === prodCat;
                    })
                  )
                );

                return (
                  <div key={item.productId} className="bg-[#111] border border-white/5 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white font-medium">{item.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-primary">${item.price.toLocaleString('es-AR')}</span>
                        <button onClick={() => updateQty(item.productId, -1)} className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm text-white w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(item.productId, 1)} className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all">
                          <Plus className="w-3 h-3" />
                        </button>
                        <button onClick={() => setItems(items.filter(i => i.productId !== item.productId))} className="w-6 h-6 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-all">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Adicionales */}
                    {applicableAddons.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {applicableAddons.map((a: any) => {
                          const selected = item.addons.some(ad => ad.addonId === a._id);
                          return (
                            <button
                              key={a._id}
                              onClick={() => toggleAddon(item.productId, a)}
                              className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${
                                selected
                                  ? 'bg-primary text-black border-primary'
                                  : 'bg-white/5 text-white/40 border-white/10 hover:border-white/30'
                              }`}
                            >
                              {a.title} +${a.price?.toLocaleString('es-AR')}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Total + submit */}
          {items.length > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="text-sm text-white/50">
                Total: <span className="text-primary font-bold text-base">${total.toLocaleString('es-AR')}</span>
                {deliveryCost > 0 && <span className="text-xs ml-1 text-white/30">(incl. envío)</span>}
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-bold rounded-lg text-sm hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirmar pedido
              </button>
            </div>
          )}

          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
      )}
    </div>
  );
}