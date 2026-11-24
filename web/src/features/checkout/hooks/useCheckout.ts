'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart.store';
import { useDelivery } from './useDelivery';
import { useShallow } from 'zustand/shallow'
import api from '@/services/api';
import type { Coupon } from '@/types';
import { PAYMENT_LABELS, type PaymentKey } from '@/constants/admin';

interface SavedOrder {
  orderNumber?: number;
  customer?: { name: string };
  deliveryType: 'pickup' | 'delivery';
  delivery?: { address?: string };
  paymentMethod: PaymentKey;
  notes?: string;
  items: Array<{
    title: string; price: number; quantity: number; precioIngredientes?: number;
    addons?: Array<{ title?: string; name?: string; price: number; quantity: number }>;
    ingredientes?: Array<{ ingredienteNombre: string; grupoNombre: string; cantidad: number; precio: number }>;
  }>;
  subtotal: number; discountPercent?: number; surcharge?: number; total: number; couponCode?: string;
}

export function useCheckout() {
  const router = useRouter();
  
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
  const { loading: isDeliveryLoading } = useDelivery();

  const [name, setName]                     = useState('');
  const [phone, setPhone]                   = useState('');
  const [notes, setNotes]                   = useState(''); 
  const [couponCode, setCouponCode]         = useState('');
  const [couponLoading, setCouponLoading]   = useState(false);
  const [couponError, setCouponError]       = useState('');
  const [submitting, setSubmitting]         = useState(false);
  const [submitError, setSubmitError]       = useState('');
  // 📦 Dirección sin geolocalizar: Mapbox no la encontró, el costo se coordina por WhatsApp
  const [unresolvedAddressModal, setUnresolvedAddressModal] = useState(false);

  const isConfirmDisabled =
    items.length === 0 || !name.trim() || !phone.trim() || !paymentMethod ||
    (deliveryType === 'delivery' && !deliveryAddress) || isDeliveryLoading || submitting;

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

    // 📦 Dirección sin coordenadas → avisamos que el envío se coordina por WhatsApp
    if (deliveryType === 'delivery' && !deliveryCoordinates) {
      setUnresolvedAddressModal(true);
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
          ingredientes: (item.ingredientes ?? []).map(ingredient => ({ grupoId: ingredient.grupoId, ingredienteId: ingredient.ingredienteId, cantidad: ingredient.cantidad })),
        })),
        deliveryType,
        paymentMethod,
        notes: notes.trim(),
        ...(coupon && couponCode ? { couponCode: couponCode.trim() } : {}),
        ...(deliveryType === 'delivery'
          ? { delivery: { address: deliveryAddress, ...(deliveryCoordinates ? { coordinates: deliveryCoordinates } : {}) } }
          : {}),
      };

      const res = await api.post('/orders', payload);
      const savedOrder = res.data?.data as SavedOrder | undefined;
      if (!savedOrder || !Array.isArray(savedOrder.items)) throw new Error('La API no devolvió el pedido confirmado');

      sessionStorage.setItem('order_confirmation', JSON.stringify({
        orderNumber: savedOrder.orderNumber,
        customerName: savedOrder.customer?.name ?? name.trim(),
        deliveryType: savedOrder.deliveryType,
        deliveryAddress: savedOrder.delivery?.address ?? null,
        paymentMethod: PAYMENT_LABELS[savedOrder.paymentMethod as PaymentKey] ?? savedOrder.paymentMethod,
        rawPaymentMethod: savedOrder.paymentMethod,
        notes: savedOrder.notes ?? '',
        items: savedOrder.items.map(item => ({
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          addons: (item.addons ?? []).map(a => ({
            name: a.title ?? a.name,
            quantity: a.quantity,
            price: a.price,
          })),
          ingredientes: (item.ingredientes ?? []).map(entry => ({ nombre: entry.ingredienteNombre, grupo: entry.grupoNombre, cantidad: entry.cantidad, precio: entry.precio })),
          itemTotal: (item.price + (item.precioIngredientes ?? 0) + (item.addons ?? []).reduce((sum, a) => sum + a.price * a.quantity, 0)) * item.quantity,
        })),
        subtotal: savedOrder.subtotal,
        discount: savedOrder.subtotal * (savedOrder.discountPercent ?? 0) / 100,
        surcharge: savedOrder.surcharge ?? 0,
        total: savedOrder.total,
        couponCode: savedOrder.couponCode ?? null,
      }));

      router.push('/order-confirmation');
      
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
    unresolvedAddressModal,
    confirmUnresolvedDelivery: async () => {
      setUnresolvedAddressModal(false);
      await submitOrder();
    },
    cancelUnresolvedDelivery: () => setUnresolvedAddressModal(false),
    subtotal, discount, surcharge, total, // ⚡ Retorna el recargo dinámico
  };
}
