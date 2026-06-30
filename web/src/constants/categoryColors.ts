// Paleta de colores para categorías dinámicas — cicla si hay más categorías que colores
export const CAT_PALETTE = [
  'bg-primary/15 text-primary border-primary/25',
  'bg-orange-500/15 text-orange-400 border-orange-500/25',
  'bg-blue-500/15 text-blue-400 border-blue-500/25',
  'bg-purple-500/15 text-purple-400 border-purple-500/25',
  'bg-pink-500/15 text-pink-400 border-pink-500/25',
  'bg-teal-500/15 text-teal-400 border-teal-500/25',
];

// Construye un mapa categoría._id → color y categoría.name → color
export function buildCatColorMap(cats: { _id: string; name: string }[]): Record<string, string> {
  const map: Record<string, string> = {};
  cats.forEach((cat, i) => {
    const color = CAT_PALETTE[i % CAT_PALETTE.length];
    map[cat._id] = color;
    map[cat.name] = color;
  });
  return map;
}