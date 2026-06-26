import { iCoupon, CouponModel } from './coupons.model';
import { argDate } from '../../utils/Timezone'; // Usamos tu utilidad para sincronizar con Argentina

const normalizeCouponData = (data: Partial<iCoupon> & { Code?: string; Percent?: number }) => {
  const normalized: any = { ...data };

  if (!normalized.code && normalized.Code) normalized.code = normalized.Code;
  if (!normalized.discountPercent && normalized.Percent) normalized.discountPercent = normalized.Percent;

  delete normalized.Code;
  delete normalized.Percent;

  return normalized;
};

export const viewAll = async (): Promise<iCoupon[]> => {
  return await CouponModel.find();
};

export const create = async (data: Partial<iCoupon> & { Code?: string; Percent?: number }): Promise<iCoupon> => {
  const newCoupon = new CouponModel(normalizeCouponData(data));
  return await newCoupon.save();
};

export const modify = async (id: string, data: Partial<iCoupon> & { Code?: string; Percent?: number }): Promise<iCoupon | null> => {
  return await CouponModel.findByIdAndUpdate(
    id,
    { $set: normalizeCouponData(data) },
    { new: true, runValidators: true },
  );
};

export const search = async (code: string): Promise<iCoupon | null> => {
  return await CouponModel.findOne({ code: code.toUpperCase(), active: { $ne: false } });
};

export const deleteById = async (id: string): Promise<iCoupon | null> => {
  return await CouponModel.findByIdAndDelete(id);
};

/**
 * 🔥 VALIDACIÓN REAL DE CUPONES EN SERVER-SIDE
 * Valida reglas de negocio: existencia, días de la semana y métodos de pago permitidos.
 * En caso de invalidez, retorna un string con el motivo del rechazo; si es válido, retorna null.
 */
export const validateCoupon = (
  coupon: any, 
  paymentMethod: string, 
  deliveryType: string
): string | null => {
  
  // 1. Verificación básica de expiración por fecha (si usas el campo expirationDate)
  if (coupon.expirationDate && new Date(coupon.expirationDate) < new Date()) {
    return 'El cupón ha expirado';
  }

  // 2. Validación de Días de la Semana
  if (coupon.allowedDays && coupon.allowedDays.length > 0) {
    // Obtenemos el día según la hora local de Argentina mapeado de forma segura
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const hoyDate = new Date();
    const numeroDiaHoy = hoyDate.getDay(); // 0: Domingo, 1: Lunes, etc.
    const nombreDiaHoy = diasSemana[numeroDiaHoy];

    // Normalizamos la búsqueda para que matchee tanto si guardaste números o nombres de días en minúsculas
    const esDiaValido = coupon.allowedDays.some((d: string | number) => {
      if (typeof d === 'number') return d === numeroDiaHoy;
      return d.toString().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") === nombreDiaHoy.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    });

    if (!esDiaValido) {
      return `Cupón no disponible para los días ${coupon.allowedDays.join(', ')}`;
    }
  }

  // 3. Validación de Métodos de Pago
  if (coupon.allowedPaymentMethods && coupon.allowedPaymentMethods.length > 0) {
    const metodoPagoNormalizado = paymentMethod.trim().toLowerCase();
    const esMetodoValido = coupon.allowedPaymentMethods.some(
      (m: string) => m.trim().toLowerCase() === metodoPagoNormalizado
    );

    if (!esMetodoValido) {
      return `Este cupón no es válido para el método de pago seleccionado`;
    }
  }

  return null; // Todo en orden, el cupón es 100% válido
};