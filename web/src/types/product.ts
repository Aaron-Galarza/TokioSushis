import { Addon } from './addon'; 

export interface ConfigOption {
  id: string;
  label: string;
  description?: string;
  price: number;
  kind: 'selection' | 'exclusion';
  isExtra?: boolean;
  defaultSelected?: boolean;
  active?: boolean;
}

export interface ConfigStep {
  id: string;
  label: string;
  title: string;
  description?: string;
  type: 'single' | 'multiple';
  mode: 'absolute' | 'delta';
  min: number;
  max: number;
  required: boolean;
  options: ConfigOption[];
}

export interface Configurator {
  enabled: boolean;
  key: string;
  steps: ConfigStep[];
}

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
  stock?: number;
  configurator?: Configurator;
}
