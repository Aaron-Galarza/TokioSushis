export interface Coupon {
  id: string;
  code: string; // Ejemplo: "BURGER20"
  discountPercent: number;
  active: boolean;
  validDays?: number[]; // Días de la semana válidos (0 para Domingo, 1 para Lunes, etc.)
  validPaymentMethods?: ('cash' | 'transfer' | 'mercadopago')[];
}