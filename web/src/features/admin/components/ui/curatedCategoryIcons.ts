import type { IconName } from 'lucide-react/dynamic';

// Lucide no incluye símbolos específicos para sushi, ramen o kimchi.
// Priorizamos ingredientes, preparación y formas de servir que sí existen.
export const CURATED_CATEGORY_ICONS = [
  'fish', 'fish-symbol', 'shrimp', 'shell', 'beef', 'drumstick', 'ham',
  'egg', 'egg-fried', 'carrot', 'bean', 'leaf', 'leafy-green', 'sprout',
  'vegan', 'apple', 'banana', 'cherry', 'citrus', 'grape', 'nut',
  'soup', 'cooking-pot', 'chef-hat', 'utensils', 'utensils-crossed',
  'flame', 'droplet', 'salad', 'sandwich', 'hamburger', 'pizza',
  'croissant', 'cookie', 'cake', 'cake-slice', 'cupcake', 'dessert',
  'ice-cream-bowl', 'ice-cream-cone', 'popsicle', 'candy', 'lollipop',
  'popcorn', 'coffee', 'milk', 'glass-water', 'beer', 'wine',
  'bottle-wine', 'martini',
  'store', 'shopping-bag', 'shopping-basket', 'package', 'package-open',
  'truck', 'bike', 'map-pin', 'clock', 'calendar', 'gift', 'tag',
  'tags', 'star', 'sparkles', 'heart', 'party-popper', 'grid-3x3',
  'flower', 'mountain', 'waves', 'sun', 'moon',
] as const satisfies readonly IconName[];
