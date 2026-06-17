import { Addon } from './addon'; 

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
}