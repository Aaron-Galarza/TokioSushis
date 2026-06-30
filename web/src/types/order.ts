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
  id: string;
  customer: OrderCustomer;
  items: CartItem[];
  deliveryType: 'pickup' | 'delivery';
  paymentMethod: 'cash' | 'debito' | 'credito'; // 👈 Sincronizado
  notes?: string; // 👈 Agregado para que puedas visualizarlo en el admin
  couponCode?: string;
  subtotal: number;
  deliveryCost: number;
  discountPercent: number;
  total: number;
  delivery?: OrderDeliveryDetails;
  status: 'pending' | 'in-preparation' | 'ready' | 'delivered' | 'cancelled'; 
  createdAt: string;
}
