'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Product, CartItem, CartAddon, Coupon, Addon } from '@/types';

// 🛠️ HELPERS (Optimizados)
const calcItemTotal = (prod: Product, qty: number, addons: CartAddon[]) => 
  qty * (prod.price + addons.reduce((sum, a) => sum + a.addon.price * a.quantity, 0));

const areSameAddons = (a: CartAddon[], b: CartAddon[]) => {
  if (a.length !== b.length) return false;
  const sort = (x: CartAddon, y: CartAddon) => x.addon.id.localeCompare(y.addon.id);
  const sortA = [...a].sort(sort), sortB = [...b].sort(sort);
  return sortA.every((x, i) => x.addon.id === sortB[i].addon.id && x.quantity === sortB[i].quantity);
};

interface CartState {
  items: CartItem[];
  deliveryType: 'pickup' | 'delivery';
  paymentMethod: 'cash' | 'transfer' | 'mercadopago' | null;
  coupon: Coupon | null;
  deliveryAddress: string;
  deliveryCoordinates: { lat: number; lng: number } | null;
  distanceKm: number;
  deliveryCost: number;
  pricePerKm: number;

  addItem: (product: Product, quantity: number, addons: CartAddon[]) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  updateItemAddon: (itemIndex: number, addon: Addon, delta: number) => void;
  clearCart: () => void;

  setDeliveryType: (type: 'pickup' | 'delivery') => void;
  setPaymentMethod: (method: 'cash' | 'transfer' | 'mercadopago' | null) => void;
  setCoupon: (coupon: Coupon) => void;
  clearCoupon: () => void;
  setDeliveryAddress: (address: string, coords: { lat: number; lng: number }) => void;
  setDeliveryCost: (cost: number, distanceKm: number) => void;
  setPricePerKm: (price: number) => void;
  clearDelivery: () => void;

  getTotals: () => { subtotal: number; discount: number; total: number; itemCount: number; };
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
      pricePerKm: 0,

      addItem: (product, quantity, addons) => set((state) => {
        const idx = state.items.findIndex(i => i.product.id === product.id && areSameAddons(i.addons, addons));
        if (idx >= 0) {
          const newItems = [...state.items];
          newItems[idx].quantity += quantity;
          newItems[idx].itemTotal = calcItemTotal(product, newItems[idx].quantity, addons);
          return { items: newItems };
        }
        return { items: [...state.items, { product, quantity, addons, itemTotal: calcItemTotal(product, quantity, addons) }] };
      }),

      removeItem: (index) => set((state) => ({ items: state.items.filter((_, i) => i !== index) })),

      updateQuantity: (index, qty) => set((state) => {
        if (qty <= 0) return { items: state.items.filter((_, i) => i !== index) };
        const newItems = [...state.items];
        newItems[index].quantity = qty;
        newItems[index].itemTotal = calcItemTotal(newItems[index].product, qty, newItems[index].addons);
        return { items: newItems };
      }),

      // 👇 EL MOTOR CORREGIDO
      updateItemAddon: (index, addon, delta) => set((state) => {
        const item = state.items[index];
        if (!item) return state;

        const newItems = [...state.items];
        
        // 1. CLONACIÓN: Ahora la fila original se queda el adicional, y mandamos las sobrantes abajo.
        if (item.quantity > 1) {
          const leftovers = JSON.parse(JSON.stringify(item));
          leftovers.quantity = item.quantity - 1;
          leftovers.itemTotal = calcItemTotal(leftovers.product, leftovers.quantity, leftovers.addons);
          
          newItems.splice(index + 1, 0, leftovers); // Sobrantes a una fila nueva
          
          newItems[index] = JSON.parse(JSON.stringify(item));
          newItems[index].quantity = 1; // La fila que tocaste se queda con 1 para recibir el extra
        } else {
          newItems[index] = JSON.parse(JSON.stringify(item));
        }

        const target = newItems[index];

        // 2. APLICAR EXTRAS
        const existIdx = target.addons.findIndex((a: CartAddon) => a.addon.id === addon.id);
        if (existIdx >= 0) {
          target.addons[existIdx].quantity += delta;
          if (target.addons[existIdx].quantity <= 0) target.addons.splice(existIdx, 1);
        } else if (delta > 0) {
          target.addons.push({ addon, quantity: delta });
        }
        target.itemTotal = calcItemTotal(target.product, target.quantity, target.addons);

        // 3. AUTO-MERGE
        const merged: CartItem[] = [];
        newItems.forEach(curr => {
          const exist = merged.find(m => m.product.id === curr.product.id && areSameAddons(m.addons, curr.addons));
          if (exist) {
            exist.quantity += curr.quantity;
            exist.itemTotal += curr.itemTotal;
          } else {
            merged.push(curr);
          }
        });
        return { items: merged };
      }),

      clearCart: () => set({ items: [], coupon: null }),
      setDeliveryType: (type) => set({ deliveryType: type }),
      setPaymentMethod: (method) => set({ paymentMethod: method }),
      setCoupon: (coupon) => set({ coupon }),
      clearCoupon: () => set({ coupon: null }),
      setDeliveryAddress: (addr, coords) => set({ deliveryAddress: addr, deliveryCoordinates: coords }),
      setDeliveryCost: (cost, dist) => set({ deliveryCost: cost, distanceKm: dist }),
      setPricePerKm: (price) => set({ pricePerKm: price }),
      clearDelivery: () => set({ deliveryAddress: '', deliveryCoordinates: null, distanceKm: 0, deliveryCost: 0 }),

      getTotals: () => {
        const { items, coupon, deliveryType, deliveryCost } = get();
        const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
        const subtotal = items.reduce((sum, i) => sum + i.itemTotal, 0);
        const discount = (subtotal * (coupon?.active ? coupon.discountPercent : 0)) / 100;
        const total = subtotal - discount + (deliveryType === 'delivery' ? deliveryCost : 0);
        return { itemCount, subtotal, discount, total };
      },
    }),
    { name: 'american-way-cart-storage', storage: createJSONStorage(() => localStorage) }
  )
);