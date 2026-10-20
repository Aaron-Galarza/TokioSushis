'use client';

import { useState, useEffect } from 'react';
import { deliveryService } from '@/services/delivery.service';
import { createAdminOrder } from '@/services/admin.service';
import type { PaymentKey } from '@/constants/admin';

export interface LineItem {
  uid: string;
  productId: string;
  title: string;
  price: number;
  quantity: number;
  addons: { addonId: string; title: string; price: number; quantity: number }[];
  selections?: { stepId: string; optionId: string }[];
  configSummary?: string;
}

const BLANK_CUSTOMER = { name: '', phone: '' };

const selectionKey = (selections?: { stepId: string; optionId: string }[]) =>
  (selections ?? []).map((s) => `${s.stepId}=${s.optionId}`).sort().join('|');

export function useQuickOrder(products: any[], onSuccess: () => void) {
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState(BLANK_CUSTOMER);
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [paymentMethod, setPaymentMethod] = useState<PaymentKey>('cash');
  
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [items, setItems] = useState<LineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cálculo automático del costo de envío asincrónico
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

  const addProduct = (productId: string) => {
    const prod = products.find((p: any) => p._id === productId);
    if (!prod) return;
    const exists = items.find(i => i.uid === productId);
    if (exists) {
      setItems(items.map(i => i.uid === productId ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { uid: productId, productId: prod._id, title: prod.title, price: prod.price, quantity: 1, addons: [] }]);
    }
  };

  const addConfiguredProduct = (
    product: any,
    price: number,
    selections: { stepId: string; optionId: string; label?: string }[],
    summary: string,
  ) => {
    const key = selectionKey(selections);
    const uid = key ? `${product._id}:${key}` : product._id;
    const cleanSelections = selections.map((s) => ({ stepId: s.stepId, optionId: s.optionId }));
    const exists = items.find(i => i.uid === uid);
    if (exists) {
      setItems(items.map(i => i.uid === uid ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([
        ...items,
        {
          uid,
          productId: product._id,
          title: product.title,
          price,
          quantity: 1,
          addons: [],
          selections: cleanSelections,
          configSummary: summary,
        },
      ]);
    }
  };

  const updateQty = (uid: string, delta: number) => {
    setItems(prev =>
      prev
        .map(i => (i.uid === uid ? { ...i, quantity: i.quantity + delta } : i))
        .filter(i => i.quantity > 0)
    );
  };

  const updateAddonQty = (uid: string, addon: any, delta: number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.uid !== uid) return item;

        const exists = item.addons.find(a => a.addonId === addon._id);

        if (exists) {
          const newQty = exists.quantity + delta;
          if (newQty <= 0) {
            return { ...item, addons: item.addons.filter(a => a.addonId !== addon._id) };
          }
          return {
            ...item,
            addons: item.addons.map(a => (a.addonId === addon._id ? { ...a, quantity: newQty } : a)),
          };
        } else if (delta > 0) {
          return {
            ...item,
            addons: [...item.addons, { addonId: addon._id, title: addon.title, price: addon.price, quantity: 1 }],
          };
        }

        return item;
      })
    );
  };

  const removeItem = (uid: string) => setItems(prev => prev.filter(i => i.uid !== uid));

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
        customer: { name: customer.name, phone: customer.phone, address: deliveryType === 'delivery' ? address : undefined },
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          addons: i.addons.map(a => ({ addonId: a.addonId, quantity: a.quantity })),
          ...(i.selections && i.selections.length > 0 ? { selections: i.selections } : {}),
        })),
        deliveryType,
        paymentMethod,
        ...(deliveryType === 'delivery' && coords ? { delivery: { address, coordinates: coords } } : {}),
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

  return {
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
    addConfiguredProduct,
    updateQty,
    updateAddonQty,
    removeItem,
    handleSubmit,
  };
}