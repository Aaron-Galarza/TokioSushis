import { Utensils, Flame, Grid3x3, Droplet, Soup } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function getCategoryIcon(categoryName: string): LucideIcon {
  const name = categoryName.toLowerCase();
  if (name.includes('tabla')) return Utensils;
  if (name.includes('wok')) return Flame;
  if (name.includes('salsa') || name.includes('extra')) return Droplet;
  if (name.includes('variado')) return Grid3x3;
  return Soup;
}
