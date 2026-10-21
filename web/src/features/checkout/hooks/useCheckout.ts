'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart.store';
import { useDelivery } from './useDelivery';
import { useShallow } from 'zustand/shallow'
import api from '@/services/api';
import type { Coupon } from '@/types';
import { PAYMENT_LABELS, type PaymentKey } from '@/constants/admin';
import { useBranchPath } from '@/hooks/useBranchPath';
import { useBranchStore } from '@/stores/branch.store';

type PaymentMethod = PaymentKey;
export { type PaymentMethod };

export function useCheckout() {
  const router = useRouter();
  const branchPath = useBranchPath();
  const branch = useBranchStore((s) => s.branch);
  
  // ⚡ SELECTORES REACTIVOS DE ZUSTAND
  const items = useCartStore((state) => state.items);
  const deliveryType = useCartStore((state) => state.deliveryType);
  const deliveryCoordinates = useCartStore((state) => state.deliveryCoordinates);
  const deliveryAddress = useCartStore((state) => state.deliveryAddress);
  const coupon = useCartStore((state) => state.coupon);
  const paymentMethod = useCartStore((state) => state.paymentMethod); // Leemos del store
  const setPaymentMethod = useCartStore((state) => state.setPaymentMethod); // Escribimos en el store
  
  const setCoupon = useCartStore((state) => state.setCoupon);
  const clearCoupon = useCartStore((state) => state.clearCoupon);
  const clearCart = useCartStore((state) => state.clearCart);
  
  // 🔥 Los totales se recalculan automáticamente gracias al selector reactivo
  const { subtotal, discount, surcharge, total } = useCartStore(
    useShallow((state) => state.getTotals())
  );
  const { loading: isDeliveryLoading, quoteReady: isDeliveryQuoteReady } = useDelivery();

  const [name, setName]                     = useState('');
  const [phone, setPhone]                   = useState('');
  const [notes, setNotes]                   = useState(''); 
  const [couponCode, setCouponCode]         = useState('');
  const [couponLoading, setCouponLoading]   = useState(false);
  const [couponError, setCouponError]       = useState('');
  const [submitting, setSubmitting]         = useState(false);
  const [submitError, setSubmitError]       = useState('');

  const isConfirmDisabled =
    items.length === 0 || !name.trim() || !phone.trim() || !paymentMethod ||
    (deliveryType === 'delivery' && (!deliveryAddress || !isDeliveryQuoteReady)) ||
    isDeliveryLoading || submitting;

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true); setCouponError('');
    try {
      const res = await api.post(`/coupons/validate/${couponCode.trim()}`, { paymentMethod: paymentMethod ?? undefined });
      const d = res.data.data;
      setCoupon({ id: d._id, code: d.code, discountPercent: d.discountPercent, active: true } as Coupon);
    } catch (err: any) {
      setCouponError(err.response?.data?.error || 'Cupón inválido');
      clearCoupon();
    } finally { setCouponLoading(false); }
  };

  const handleCouponInput = (val: string) => {
    setCouponCode(val.toUpperCase());
    if (!val) { clearCoupon(); setCouponError(''); }
  };

  const handleConfirmOrder = async () => {
    if (isConfirmDisabled) return;

    if (deliveryType === 'delivery' && !deliveryCoordinates) {
      setSubmitError('Seleccioná una dirección válida en el mapa para calcular el envío.');
      return;
    }

    await submitOrder();
  };

  const submitOrder = async () => {
    setSubmitting(true); setSubmitError('');
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
          addons: item.addons.map(a => ({ addonId: a.addon.id, quantity: a.quantity })),
          ...(item.selections && item.selections.length > 0
            ? { selections: item.selections.map(s => ({ stepId: s.stepId, optionId: s.optionId })) }
            : {}),
        })),
        deliveryType,
        paymentMethod,
        notes: notes.trim(),
        ...(coupon && couponCode ? { couponCode: couponCode.trim() } : {}),
        ...(deliveryType === 'delivery'
          ? { delivery: { address: deliveryAddress, ...(deliveryCoordinates ? { coordinates: deliveryCoordinates } : {}) } }
          : {}),
      };

      const serializedPayload = JSON.stringify(payload);
      const savedAttempt = sessionStorage.getItem('pending_order_attempt');
      let attempt: { payload: string; key: string } | null = null;
      try { attempt = savedAttempt ? JSON.parse(savedAttempt) : null; } catch { /* Create a fresh key below. */ }
      if (attempt?.payload !== serializedPayload) {
        attempt = { payload: serializedPayload, key: crypto.randomUUID() };
        sessionStorage.setItem('pending_order_attempt', JSON.stringify(attempt));
      }
      const res = await api.post('/orders', payload, { headers: { 'Idempotency-Key': attempt!.key } });
      sessionStorage.removeItem('pending_order_attempt');
      const savedOrder = res.data.data;
      const orderNumber = savedOrder.orderNumber || savedOrder._id?.slice(-4);

      sessionStorage.setItem(`order_confirmation:${branch?.slug}`, JSON.stringify({
        orderNumber,
        customerName: savedOrder.customer.name,
        deliveryType: savedOrder.deliveryType,
        deliveryAddress: savedOrder.delivery?.address || null,
        paymentMethod: PAYMENT_LABELS[savedOrder.paymentMethod as PaymentKey] ?? savedOrder.paymentMethod,
        rawPaymentMethod: savedOrder.paymentMethod,
        transferAlias: branch?.transferAlias,
        transferHolder: branch?.transferHolder,
        notes: savedOrder.notes || '',
        items: savedOrder.items.map((item: any) => ({
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          configSummary: item.configSummary,
          addons: (item.addons || []).map((a: any) => ({
            name: a.title,
            quantity: a.quantity,
            price: a.price,
          })),
          itemTotal: item.quantity * (item.price + (item.addons || []).reduce((sum: number, addon: any) => sum + addon.price * addon.quantity, 0)),
        })),
        subtotal: savedOrder.subtotal,
        discount: savedOrder.subtotal * savedOrder.discountPercent / 100,
        surcharge: savedOrder.surcharge,
        total: savedOrder.total,
        couponCode: savedOrder.couponCode || null,
      }));

      router.push(branchPath('/order-confirmation'));
      
      setTimeout(() => clearCart(), 100);
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || 'Error al enviar el pedido. Intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    items, deliveryType, deliveryCoordinates, coupon, isDeliveryLoading,
    name, setName, phone, setPhone,
    notes, setNotes, 
    paymentMethod, setPaymentMethod,
    couponCode, couponLoading, couponError, validateCoupon, handleCouponInput,
    submitting, submitError, isConfirmDisabled, handleConfirmOrder,
    subtotal, discount, surcharge, total, // ⚡ Retorna el recargo dinámico
  };
}
