import {
  Utensils, Flame, Droplet, Grid3x3, Soup,
  Fish, Beef, Salad, Coffee, IceCream,
  Pizza, Cookie, Wine, Sandwich, Star,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Mapa de nombre → componente
// Este es el conjunto de íconos disponibles para asignar a categorías
export const CATEGORY_ICON_OPTIONS: { name: string; icon: LucideIcon }[] = [
  { name: 'Utensils', icon: Utensils },
  { name: 'Fish',     icon: Fish     },
  { name: 'Beef',     icon: Beef     },
  { name: 'Flame',    icon: Flame    },
  { name: 'Soup',     icon: Soup     },
  { name: 'Salad',    icon: Salad    },
  { name: 'Droplet',  icon: Droplet  },
  { name: 'Coffee',   icon: Coffee   },
  { name: 'IceCream', icon: IceCream },
  { name: 'Pizza',    icon: Pizza    },
  { name: 'Cookie',   icon: Cookie   },
  { name: 'Wine',     icon: Wine     },
  { name: 'Sandwich', icon: Sandwich },
  { name: 'Grid3x3',  icon: Grid3x3  },
  { name: 'Star',     icon: Star     },
];

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  CATEGORY_ICON_OPTIONS.map(({ name, icon }) => [name, icon])
);

// Devuelve el componente dado el nombre guardado en DB
// Si no hay icono asignado, intenta inferirlo por nombre de categoría (fallback)
export function getCategoryIcon(categoryName: string, iconKey?: string): LucideIcon {
  if (iconKey && ICON_MAP[iconKey]) return ICON_MAP[iconKey];

  // Fallback por nombre
  const name = categoryName.toLowerCase();
  if (name.includes('tabla'))                    return Utensils;
  if (name.includes('wok'))                      return Flame;
  if (name.includes('salsa') || name.includes('extra')) return Droplet;
  if (name.includes('variado'))                  return Grid3x3;
  return Soup;
}