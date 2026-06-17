import { CartItem } from './cart';

export interface OrderCustomer {
  name: string;
  phone: string;
}

export interface OrderDeliveryDetails {
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  distanceKm?: number;
}

export interface Order {
  id: string; // Identificador único de la orden
  customer: OrderCustomer;
  items: CartItem[];
  deliveryType: 'pickup' | 'delivery';
  paymentMethod: 'cash' | 'transfer' | 'mercadopago';
  couponCode?: string;
  subtotal: number;
  deliveryCost: number;
  discountPercent: number;
  total: number;
  delivery?: OrderDeliveryDetails;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  createdAt: string; // Para organizar por fecha/hora
}