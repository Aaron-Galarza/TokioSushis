import { Product } from './product';
import { Addon } from './addon';

export interface CartAddon {
  addon: Addon;
  quantity: number;
}

export interface CartSelection {
  stepId: string;
  stepLabel?: string;
  optionId: string;
  label: string;
  price?: number;
  kind?: 'selection' | 'exclusion';
}

export interface CartItem {
  product: Product;
  quantity: number;
  addons: CartAddon[];
  itemTotal: number; // Precio de (producto + adicionales) * cantidad
  selections?: CartSelection[];
  configSummary?: string;
}
