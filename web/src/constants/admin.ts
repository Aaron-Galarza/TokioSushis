// ── Métodos de pago ─────────────────────────────────────────────────────────
export const PAYS = ['cash', 'debito', 'credito'] as const;
export type PaymentKey = (typeof PAYS)[number];

export const PAYMENT_LABELS: Record<PaymentKey, string> = {
  cash:    'Efectivo',
  debito:  'Débito',
  credito: 'Crédito',
};

// ── Días de la semana ───────────────────────────────────────────────────────
export const CDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export const DS: Record<string, string> = {
  monday:    'Lunes',
  tuesday:   'Martes',
  wednesday: 'Miércoles',
  thursday:  'Jueves',
  friday:    'Viernes',
  saturday:  'Sábado',
  sunday:    'Domingo',
};