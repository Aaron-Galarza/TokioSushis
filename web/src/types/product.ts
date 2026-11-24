import { Addon } from './addon'; 
import { ProductConfiguration } from './configurable';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
  featured: boolean;
  order: number;
  addons?: Addon[]; 
  controlStock?: boolean;
  stock?: number
  tipoProducto?: 'simple' | 'configurable';
  gruposOpciones?: Array<{ grupo: string | { _id: string }; orden: number }>;
  configuracion?: ProductConfiguration;
}
