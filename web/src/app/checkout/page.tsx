'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Receipt } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';
import { useDelivery } from '@/features/checkout/hooks/useDelivery';
import { formatPrice } from '@/lib/format';
import { DeliveryTypeSelector } from '@/features/checkout/components/DeliveryTypeSelector';
import { AddressAutocomplete } from '@/features/checkout/components/AddressAutocomplete';
import { DeliveryCostPreview } from '@/features/checkout/components/DeliveryCostPreview';
import { AddressMap } from '@/features/checkout/components/AddressMap';
import api from '@/services/api';
import type { Coupon } from '@/types';

type PaymentMethod = 'cash' | 'transfer' | 'mercadopago';

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  mercadopago: 'Mercado Pago',
};

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    deliveryType,
    deliveryCoordinates,
    deliveryAddress,
    coupon,
    setCoupon,
    clearCoupon,
    clearCart,
    getTotals,
  } = useCartStore();
  const { loading: isDeliveryLoading } = useDelivery();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { subtotal, discount, total } = getTotals();

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await api.post(`/coupons/validate/${couponCode.trim()}`, {
        paymentMethod: paymentMethod ?? undefined,
      });
      const d = res.data.data;
      setCoupon({
        id: d._id,
        code: d.code,
        discountPercent: d.discountPercent,
        active: true,
      } as Coupon);
    } catch (err: any) {
      setCouponError(err.response?.data?.error || 'Cupón inválido');
      clearCoupon();
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCouponInput = (val: string) => {
    setCouponCode(val.toUpperCase());
    if (!val) { clearCoupon(); setCouponError(''); }
  };

  const isConfirmDisabled =
    items.length === 0 ||
    !name.trim() ||
    !phone.trim() ||
    !paymentMethod ||
    (deliveryType === 'delivery' && !deliveryCoordinates) ||
    isDeliveryLoading ||
    submitting;

  const handleConfirmOrder = async () => {
    if (isConfirmDisabled) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const payload: Record<string, any> = {
        customer: {
          name: name.trim(),
          phone: phone.trim(),
          ...(deliveryType === 'delivery' ? { address: deliveryAddress } : {}),
        },
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          addons: item.addons.map(a => ({
            addonId: a.addon.id,
            quantity: a.quantity,
          })),
        })),
        deliveryType,
        paymentMethod,
        ...(coupon && couponCode ? { couponCode: couponCode.trim() } : {}),
        ...(deliveryType === 'delivery' && deliveryCoordinates
          ? { delivery: { address: deliveryAddress, coordinates: deliveryCoordinates } }
          : {}),
      };
      await api.post('/orders', payload);
      clearCart();
      router.push('/order-confirmation');
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || 'Error al enviar el pedido. Intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-white/50 mb-4">Tu pedido está vacío</p>
        <button onClick={() => router.push('/cart')} className="text-primary font-bold">
          Volver al carrito
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-xl border-b border-white/10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <Link href="/cart" className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/90">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-heading text-xl tracking-wide text-white mt-1">FINALIZAR PEDIDO</h1>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-6 pb-12 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Delivery type */}
        <section>
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3 px-1">Método de entrega</h2>
          <DeliveryTypeSelector />
        </section>

        {deliveryType === 'delivery' && (
          <section className="animate-in fade-in slide-in-from-top-2 duration-300">
            <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3 px-1">¿A dónde lo enviamos?</h2>
            <div className="flex flex-col gap-2">
              <AddressAutocomplete />
              <DeliveryCostPreview />
              <AddressMap />
            </div>
          </section>
        )}

        {/* Customer info */}
        <section>
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3 px-1">Tus datos</h2>
          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
            <input
              type="text"
              placeholder="Nombre"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-zinc-800 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/30 text-sm w-full"
            />
            <input
              type="tel"
              placeholder="Teléfono"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="bg-zinc-800 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/30 text-sm w-full"
            />
          </div>
        </section>

        {/* Payment method */}
        <section>
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3 px-1">Método de pago</h2>
          <div className="flex gap-2">
            {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map(method => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`flex-1 py-2.5 px-2 rounded-xl font-bold text-sm transition-all ${
                  paymentMethod === method
                    ? 'bg-primary text-black'
                    : 'bg-zinc-900 border border-white/10 text-white/60 hover:text-white'
                }`}
              >
                {PAYMENT_LABELS[method]}
              </button>
            ))}
          </div>
        </section>

        {/* Coupon */}
        <section>
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3 px-1">Cupón (opcional)</h2>
          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Código de cupón"
                value={couponCode}
                onChange={e => handleCouponInput(e.target.value)}
                className="flex-1 bg-zinc-800 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/30 text-sm"
              />
              <button
                onClick={validateCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="bg-zinc-700 text-white font-bold px-4 rounded-xl text-sm hover:bg-zinc-600 disabled:opacity-40 transition-colors"
              >
                {couponLoading ? '...' : 'Aplicar'}
              </button>
            </div>
            {couponError && <p className="text-red-400 text-xs">{couponError}</p>}
            {coupon && (
              <p className="text-green-400 text-xs">
                ✓ Cupón aplicado: {coupon.discountPercent}% de descuento
              </p>
            )}
          </div>
        </section>

        {/* Summary */}
        <section>
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
            <Receipt className="w-4 h-4" /> Resumen de pago
          </h2>
          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex flex-col gap-3 pb-3 border-b border-white/10">
              {items.map((item, index) => (
                <div key={index} className="flex flex-col gap-1">
                  <div className="flex justify-between items-start text-sm">
                    <div className="flex gap-2 text-white/80 pr-4">
                      <span className="font-bold text-white/40">{item.quantity}x</span>
                      <span className="leading-tight">{item.product.title}</span>
                    </div>
                    <span className="font-semibold text-primary shrink-0">{formatPrice(item.itemTotal)}</span>
                  </div>
                  {item.addons && item.addons.length > 0 && (
                    <div className="flex flex-col gap-0.5 pl-6">
                      {item.addons.map((a, i) => (
                        <div key={i} className="text-xs text-white/50 flex gap-1.5">
                          <span className="text-white/30">↳</span>
                          {a.quantity}x {a.addon.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between text-sm text-white/60">
              <span>Subtotal</span>
              <span className="font-medium text-primary/80">{formatPrice(subtotal)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-sm text-primary">
                <span>Descuento</span>
                <span>−{formatPrice(discount)}</span>
              </div>
            )}

            {deliveryType === 'delivery' && (
              <div className="flex justify-between text-sm text-white/70">
                <span>Envío</span>
                {isDeliveryLoading ? (
                  <span className="text-white/40 animate-pulse">Calculando...</span>
                ) : (
                  <span className="font-medium text-primary">
                    {formatPrice(Math.max(0, total - subtotal + discount))}
                  </span>
                )}
              </div>
            )}

            <div className="border-t border-white/10 my-1" />
            <div className="flex justify-between items-center">
              <span className="font-bold text-white">Total a pagar</span>
              <span className="text-2xl font-black text-primary drop-shadow-[0_0_15px_rgba(197,168,111,0.25)]">
                {formatPrice(total)}
              </span>
            </div>
          </div>
        </section>

        {submitError && (
          <p className="text-red-400 text-sm text-center bg-red-400/10 px-4 py-2 rounded-xl">
            {submitError}
          </p>
        )}

        <section className="mt-2">
          <button
            onClick={handleConfirmOrder}
            disabled={isConfirmDisabled}
            className={`w-full py-4 px-6 rounded-xl font-extrabold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${
              isConfirmDisabled
                ? 'bg-zinc-800 text-white/30 cursor-not-allowed'
                : 'bg-primary text-black hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(197,168,111,0.2)]'
            }`}
          >
            {submitting
              ? 'Enviando pedido...'
              : isDeliveryLoading
              ? 'Calculando envío...'
              : 'Confirmar Pedido'}
            {!isConfirmDisabled && <CheckCircle2 className="w-5 h-5" />}
          </button>
        </section>

      </main>
    </div>
  );
}
