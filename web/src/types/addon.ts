export interface AddonCategory {
  _id: string;
  name: string;
  active: boolean;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
  active: boolean;
  categories: AddonCategory[]; // array de categorías populadas desde el backend
}