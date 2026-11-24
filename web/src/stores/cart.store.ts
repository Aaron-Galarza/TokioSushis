'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Product, CartItem, CartAddon, Coupon, Addon } from '@/types';
import type { SelectedIngredient } from '@/types';

// 🛠️ HELPERS
const calcItemTotal = (prod: Product, qty: number, addons: CartAddon[], ingredientes: SelectedIngredient[] = []) =>
  qty * (prod.price + addons.reduce((sum, a) => sum + a.addon.price * a.quantity, 0)
    + ingredientes.reduce((sum, item) => sum + (item.precio ?? 0) * item.cantidad, 0));

const ingredientKey = (items: SelectedIngredient[] = []) => items.map(item => `${item.grupoId}:${item.ingredienteId}:${item.cantidad}`).sort().join('|');

const areSameAddons = (a: CartAddon[], b: CartAddon[]) => {
  if (a.length !== b.length) return false;
  const sort = (x: CartAddon, y: CartAddon) => x.addon.id.localeCompare(y.addon.id);
  const sortA = [...a].sort(sort), sortB = [...b].sort(sort);
  return sortA.every((x, i) => x.addon.id === sortB[i].addon.id && x.quantity === sortB[i].quantity);
};

const mergeSameItems = (items: CartItem[]) => {
  const merged: CartItem[] = [];
  for (const item of items) {
    const previous = merged.find(candidate => candidate.product.id === item.product.id &&
      areSameAddons(candidate.addons, item.addons) && ingredientKey(candidate.ingredientes) === ingredientKey(item.ingredientes));
    if (previous) {
      previous.quantity += item.quantity;
      previous.product = item.product;
      previous.addons = item.addons;
      previous.ingredientes = item.ingredientes;
      previous.itemTotal = calcItemTotal(previous.product, previous.quantity, previous.addons, previous.ingredientes);
    } else merged.push({ ...item });
  }
  return merged;
};

interface CartState {
  items: CartItem[];
  deliveryType: 'pickup' | 'delivery';
  paymentMethod: 'cash' | 'debito' | 'credito' | 'transferencia' | null; // 💳 Sincronizado
  coupon: Coupon | null;
  deliveryAddress: string;
  deliveryCoordinates: { lat: number; lng: number } | null;
  distanceKm: number;
  deliveryCost: number;

  addItem: (product: Product, quantity: number, addons: CartAddon[], ingredientes?: SelectedIngredient[]) => void;
  updateItemIngredients: (index: number, ingredientes: SelectedIngredient[], product: Product) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  updateItemAddon: (itemIndex: number, addon: Addon, delta: number) => void;
  clearCart: () => void;

  setDeliveryType: (type: 'pickup' | 'delivery') => void;
  setPaymentMethod: (method: 'cash' | 'debito' | 'credito' | 'transferencia' | null) => void; // 💳 Sincronizado
  setCoupon: (coupon: Coupon) => void;
  clearCoupon: () => void;
  setDeliveryAddress: (address: string, coords: { lat: number; lng: number } | null) => void;
  setDeliveryCost: (cost: number, distanceKm: number) => void;
  clearDelivery: () => void;

  // ⚡ Ahora getTotals expone explícitamente el recargo (surcharge)
  getTotals: () => { subtotal: number; discount: number; surcharge: number; total: number; itemCount: number; };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      deliveryType: 'pickup',
      paymentMethod: null,
      coupon: null,
      deliveryAddress: '',
      deliveryCoordinates: null,
      distanceKm: 0,
      deliveryCost: 0,

      addItem: (product, quantity, addons, ingredientes = []) => set((state) => {
        const idx = state.items.findIndex(i => i.product.id === product.id && areSameAddons(i.addons, addons) && ingredientKey(i.ingredientes) === ingredientKey(ingredientes));
        if (idx >= 0) {
          const newItems = [...state.items];
          const mergedQuantity = newItems[idx].quantity + quantity;
          newItems[idx] = { ...newItems[idx], product, quantity: mergedQuantity, addons, ingredientes,
            itemTotal: calcItemTotal(product, mergedQuantity, addons, ingredientes) };
          return { items: newItems };
        }
        return { items: [...state.items, { product, quantity, addons, ingredientes, itemTotal: calcItemTotal(product, quantity, addons, ingredientes) }] };
      }),

      updateItemIngredients: (index, ingredientes, product) => set(state => {
        const items = [...state.items];
        const original = items[index];
        if (!original) return state;
        const updated: CartItem = { ...original, product, quantity: 1, ingredientes,
          itemTotal: calcItemTotal(product, 1, original.addons, ingredientes) };
        if (original.quantity > 1) {
          items[index] = { ...original, quantity: original.quantity - 1,
            itemTotal: calcItemTotal(original.product, original.quantity - 1, original.addons, original.ingredientes) };
          items.splice(index + 1, 0, updated);
        } else items[index] = updated;
        return { items: mergeSameItems(items) };
      }),

      removeItem: (index) => set((state) => ({ items: state.items.filter((_, i) => i !== index) })),

      updateQuantity: (index, qty) => set((state) => {
        if (qty <= 0) return { items: state.items.filter((_, i) => i !== index) };
        const newItems = [...state.items];
        const original = newItems[index];
        if (!original) return state;
        newItems[index] = { ...original, quantity: qty,
          itemTotal: calcItemTotal(original.product, qty, original.addons, original.ingredientes) };
        return { items: newItems };
      }),

      updateItemAddon: (index, addon, delta) => set((state) => {
        const item = state.items[index];
        if (!item) return state;

        const newItems = [...state.items];
        
        if (item.quantity > 1) {
          const leftovers = JSON.parse(JSON.stringify(item));
          leftovers.quantity = item.quantity - 1;
          leftovers.itemTotal = calcItemTotal(leftovers.product, leftovers.quantity, leftovers.addons, leftovers.ingredientes);
          
          newItems.splice(index + 1, 0, leftovers);
          
          newItems[index] = JSON.parse(JSON.stringify(item));
          newItems[index].quantity = 1;
        } else {
          newItems[index] = JSON.parse(JSON.stringify(item));
        }

        const target = newItems[index];

        const existIdx = target.addons.findIndex((a: CartAddon) => a.addon.id === addon.id);
        if (existIdx >= 0) {
          target.addons[existIdx].quantity += delta;
          if (target.addons[existIdx].quantity <= 0) target.addons.splice(existIdx, 1);
        } else if (delta > 0) {
          target.addons.push({ addon, quantity: delta });
        }
        target.itemTotal = calcItemTotal(target.product, target.quantity, target.addons, target.ingredientes);

        return { items: mergeSameItems(newItems) };
      }),

      clearCart: () => set({ items: [], coupon: null, paymentMethod: null }),
      setDeliveryType: (type) => set({ deliveryType: type }),
      setPaymentMethod: (method) => set({ paymentMethod: method }),
      setCoupon: (coupon) => set({ coupon }),
      clearCoupon: () => set({ coupon: null }),
      setDeliveryAddress: (addr, coords) => set({ deliveryAddress: addr, deliveryCoordinates: coords }),
      setDeliveryCost: (cost, dist) => set({ deliveryCost: cost, distanceKm: dist }),
      clearDelivery: () => set({ deliveryAddress: '', deliveryCoordinates: null, distanceKm: 0, deliveryCost: 0 }),

      // 🧮 MOTOR DE CÁLCULO ACTUALIZADO
      getTotals: () => {
        const { items, coupon, deliveryType, deliveryCost, paymentMethod } = get();
        const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
        const subtotal = items.reduce((sum, i) => sum + i.itemTotal, 0);
        const discount = (subtotal * (coupon?.active ? coupon.discountPercent : 0)) / 100;
        
        // El total base incluye subtotal, descuentos y costo de envío (si aplica)
        const baseTotal = subtotal - discount + (deliveryType === 'delivery' ? deliveryCost : 0);
        
        // Si el método es crédito, aplica el 15% sobre el total base
        const surcharge = paymentMethod === 'credito' ? Math.round(baseTotal * 0.15) : 0;
        const total = baseTotal + surcharge;

        return { itemCount, subtotal, discount, surcharge, total };
      },
    }),
    { name: 'american-way-cart-storage', storage: createJSONStorage(() => localStorage) }
  )
);
