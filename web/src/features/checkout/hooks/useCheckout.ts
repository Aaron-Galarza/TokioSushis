'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart.store';
import { useDelivery } from './useDelivery';
import api from '@/services/api';
import type { Coupon } from '@/types';

type PaymentMethod = 'cash' | 'transfer' | 'mercadopago';
export { type PaymentMethod };

export function useCheckout() {
  const router = useRouter();
  const { items, deliveryType, deliveryCoordinates, deliveryAddress, coupon, setCoupon, clearCoupon, clearCart, getTotals } = useCartStore();
  const { loading: isDeliveryLoading } = useDelivery();

  const [name, setName]                     = useState('');
  const [phone, setPhone]                   = useState('');
  const [paymentMethod, setPaymentMethod]   = useState<PaymentMethod | null>(null);
  const [couponCode, setCouponCode]         = useState('');
  const [couponLoading, setCouponLoading]   = useState(false);
  const [couponError, setCouponError]       = useState('');
  const [submitting, setSubmitting]         = useState(false);
  const [submitError, setSubmitError]       = useState('');

  const { subtotal, discount, total } = getTotals();

  const isConfirmDisabled =
    items.length === 0 || !name.trim() || !phone.trim() || !paymentMethod ||
    (deliveryType === 'delivery' && !deliveryCoordinates) || isDeliveryLoading || submitting;

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
        })),
        deliveryType,
        paymentMethod,
        ...(coupon && couponCode ? { couponCode: couponCode.trim() } : {}),
        ...(deliveryType === 'delivery' && deliveryCoordinates
          ? { delivery: { address: deliveryAddress, coordinates: deliveryCoordinates } }
          : {}),
      };

      const res = await api.post('/orders', payload);
      const orderNumber = res.data?.data?.orderNumber;

      // Snapshot para la página de confirmación — se limpia al leerlo
      const payLabels: Record<string, string> = {
        cash: 'Efectivo',
        transfer: 'Transferencia',
        mercadopago: 'Mercado Pago',
      };

      sessionStorage.setItem('order_confirmation', JSON.stringify({
        orderNumber,
        customerName: name.trim(),
        deliveryType,
        deliveryAddress: deliveryType === 'delivery' ? deliveryAddress : null,
        paymentMethod: payLabels[paymentMethod ?? ''] ?? paymentMethod,
        items: items.map(item => ({
          title: item.product.title,
          quantity: item.quantity,
          price: item.product.price,
          addons: item.addons.map(a => ({
            name: a.addon.name,
            quantity: a.quantity,
            price: a.addon.price,
          })),
          itemTotal: item.itemTotal,
        })),
        subtotal,
        discount,
        total,
        couponCode: coupon ? couponCode.trim() : null,
      }));

      router.push('/order-confirmation');
      // Limpiar después de navegar para evitar que el checkout
      // re-renderice con carrito vacío antes de que termine la navegación
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
    paymentMethod, setPaymentMethod,
    couponCode, couponLoading, couponError, validateCoupon, handleCouponInput,
    submitting, submitError, isConfirmDisabled, handleConfirmOrder,
    subtotal, discount, total,
  };
}