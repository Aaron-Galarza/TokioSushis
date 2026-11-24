import { Product } from './product';
import { Addon } from './addon';
import { SelectedIngredient } from './configurable';

export interface CartAddon {
  addon: Addon;
  quantity: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  addons: CartAddon[];
  ingredientes?: SelectedIngredient[];
  itemTotal: number; // Precio de (producto + adicionales) * cantidad
}
