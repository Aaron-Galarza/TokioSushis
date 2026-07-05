import { argDate } from './Timezone';

export const VALID_RANGES = ['hoy', 'ayer', 'semana', 'mes'] as const;
export type Range = (typeof VALID_RANGES)[number];

/** Fecha de inicio ("YYYY-MM-DD", hora Argentina) para cada rango de reportes/pedidos. */
export const getRangeStartDate = (range: Range): string => {
  const today = argDate();
  switch (range) {
    case 'hoy':
      return today;
    case 'ayer': {
      const d = new Date(today + 'T12:00:00Z');
      d.setUTCDate(d.getUTCDate() - 1);
      return d.toISOString().slice(0, 10);
    }
    case 'semana': {
      const d = new Date(today + 'T12:00:00Z');
      const dow = d.getUTCDay();
      d.setUTCDate(d.getUTCDate() - (dow === 0 ? 6 : dow - 1));
      return d.toISOString().slice(0, 10);
    }
    case 'mes':
      return today.slice(0, 8) + '01';
  }
};
