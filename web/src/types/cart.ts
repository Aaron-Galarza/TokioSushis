import { Product } from './product';
import { Addon } from './addon';

export interface CartAddon {
  addon: Addon;
  quantity: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  addons: CartAddon[];
  itemTotal: number; // Precio de (producto + adicionales) * cantidad
}