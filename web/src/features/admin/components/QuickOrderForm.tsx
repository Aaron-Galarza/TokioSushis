'use client';

import { Plus, Minus, X, ShoppingBag, Loader2, ChevronDown } from 'lucide-react';
import { AddressAutocomplete } from '@/features/checkout/components/AddressAutocomplete';
import { useQuickOrder } from '../hooks/useQuickOrder';
import type { AddressResult } from '@/features/checkout/hooks/useAddressSearch';

interface Props {
  products: any[];
  addons: any[];
  onSuccess: () => void;
}

export function QuickOrderForm({ products, addons, onSuccess }: Props) {
  const {
    open,
    setOpen,
    customer,
    setCustomer,
    deliveryType,
    setDeliveryType,
    paymentMethod,
    setPaymentMethod,
    address,
    setAddress,
    setCoords,
    deliveryCost,
    setDeliveryCost,
    deliveryLoading,
    deliveryError,
    items,
    setItems,
    submitting,
    error,
    total,
    addProduct,
    updateQty,
    updateAddonQty,
    handleSubmit,
  } = useQuickOrder(products, onSuccess);

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 text-sm font-semibold transition-all active:scale-95 w-full sm:w-auto justify-center sm:justify-start"
      >
        <ShoppingBag className="w-4 h-4" />
        Nuevo pedido manual
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 sm:p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              placeholder="Nombre del cliente *"
              value={customer.name}
              onChange={(e) => setCustomer((p) => ({ ...p, name: e.target.value }))}
              className="bg-[#111] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 w-full"
            />
            <input
              placeholder="Teléfono *"
              value={customer.phone}
              onChange={(e) => setCustomer((p) => ({ ...p, phone: e.target.value }))}
              className="bg-[#111] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 w-full"
            />
          </div>

          {/* Delivery/Pickup + Selector de Métodos de Pago */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Tipo de entrega */}
            <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs font-semibold h-[38px]">
              {(['pickup', 'delivery'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setDeliveryType(t);
                    setCoords(null);
                    setAddress('');
                    setDeliveryCost(0);
                  }}
                  className={`flex-1 px-2 py-2 transition-all ${
                    deliveryType === t ? 'bg-primary text-black' : 'bg-[#111] text-white/40 hover:text-white'
                  }`}
                >
                  {t === 'pickup' ? 'Retiro' : 'Delivery'}
                </button>
              ))}
            </div>

            {/* Selector de Pago */}
            <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs font-semibold h-[38px]">
              {([['cash', 'Efectivo'], ['debito', 'Débito'], ['credito', 'Crédito']] as const).map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPaymentMethod(v)}
                  className={`flex-1 px-1 py-2 transition-all text-center whitespace-nowrap ${
                    paymentMethod === v ? 'bg-primary text-black' : 'bg-[#111] text-white/40 hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Dirección */}
          {deliveryType === 'delivery' && (
            <div>
              <AddressAutocomplete
                value={address}
                onChange={(r: AddressResult) => {
                  setAddress(r.placeName);
                  setCoords({ lat: r.lat, lng: r.lng });
                }}
                onClear={() => {
                  setAddress('');
                  setCoords(null);
                  setDeliveryCost(0);
                }}
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
              onChange={(e) => {
                if (e.target.value) {
                  addProduct(e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
              defaultValue=""
            >
              <option value="" disabled>+ Agregar producto</option>
              {products
                .filter((p: any) => p.active)
                .map((p: any) => (
                  <option key={p._id} value={p._id}>
                    {p.title} — ${p.price?.toLocaleString('es-AR')}
                  </option>
                ))}
            </select>
          </div>

          {/* Lista de items del carrito manual */}
          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((item) => {
                const applicableAddons = addons.filter(
                  (a: any) =>
                    a.active &&
                    (!a.categories?.length ||
                      a.categories.some((c: any) => {
                        const catId = typeof c === 'object' ? c._id : c;
                        const prod = products.find((p: any) => p._id === item.productId);
                        const prodCat = typeof prod?.category === 'object' ? prod?.category?._id : prod?.category;
                        return catId === prodCat;
                      }))
                );
                return (
                  <div key={item.productId} className="bg-[#111] border border-white/5 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-white font-medium truncate flex-1 min-w-0">
                        {item.title}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs text-primary hidden xs:inline">
                          ${item.price.toLocaleString('es-AR')}
                        </span>
                        <button
                          onClick={() => updateQty(item.productId, -1)}
                          className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all shrink-0"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm text-white w-4 text-center shrink-0">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.productId, 1)}
                          className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all shrink-0"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setItems(items.filter((i) => i.productId !== item.productId))}
                          className="w-6 h-6 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-all shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Lista de Addons filtrada por categoría del producto */}
                    {applicableAddons.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {applicableAddons.map((a: any) => {
                          const currentAddon = item.addons.find((ad) => ad.addonId === a._id);
                          const quantity = currentAddon?.quantity ?? 0;

                          return (
                            <div
                              key={a._id}
                              className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-all ${
                                quantity > 0
                                  ? 'bg-primary text-black border-primary'
                                  : 'bg-white/5 text-white/40 border-white/10 hover:border-white/30'
                              }`}
                            >
                              <span
                                onClick={() => {
                                  if (quantity === 0) updateAddonQty(item.productId, a, 1);
                                }}
                                className={quantity === 0 ? 'cursor-pointer' : ''}
                              >
                                {a.title} +${a.price?.toLocaleString('es-AR')}
                              </span>

                              {quantity > 0 && (
                                <div className="flex items-center gap-1 ml-1 pl-1 border-l border-black/20">
                                  <button
                                    type="button"
                                    onClick={() => updateAddonQty(item.productId, a, -1)}
                                    className="w-3.5 h-3.5 rounded-sm bg-black/10 hover:bg-black/20 flex items-center justify-center text-black"
                                  >
                                    <Minus className="w-2 h-2" />
                                  </button>
                                  <span className="font-bold min-w-[8px] text-center">{quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => updateAddonQty(item.productId, a, 1)}
                                    className="w-3.5 h-3.5 rounded-sm bg-black/10 hover:bg-black/20 flex items-center justify-center text-black"
                                  >
                                    <Plus className="w-2 h-2" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Total + Confirmación */}
          {items.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-white/5">
              <div className="text-sm text-white/50">
                Total:{' '}
                <span className="text-primary font-bold text-base">
                  ${total.toLocaleString('es-AR')}
                </span>
                {deliveryCost > 0 && <span className="text-xs ml-1 text-white/30">(incl. envío)</span>}
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-black font-bold rounded-lg text-sm hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 w-full sm:w-auto"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
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