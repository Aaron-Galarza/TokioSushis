// ── Métodos de pago ─────────────────────────────────────────────────────────
export const PAYS = ['cash', 'debito', 'credito', 'transferencia'] as const;
export type PaymentKey = (typeof PAYS)[number];

export const PAYMENT_LABELS: Record<PaymentKey, string> = {
  cash:          'Efectivo',
  debito:        'Débito',
  credito:       'Crédito',
  transferencia: 'Transferencia',
};

// ── Datos de la cuenta para pagos por transferencia ────────────────────────
export const TRANSFER_INFO = {
  alias:  'Tokyo.nx',
  holder: 'Román Augusto Gomez',
} as const;

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