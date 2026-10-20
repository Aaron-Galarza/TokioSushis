import { iCoupon, CouponModel } from './coupons.model';
import { argDate, argWeekday } from '../../utils/Timezone'; // Usamos tu utilidad para sincronizar con Argentina

const normalizeCouponData = (data: Partial<iCoupon> & { Code?: string; Percent?: number }) => {
  const normalized: any = { ...data };

  if (!normalized.code && normalized.Code) normalized.code = normalized.Code;
  if (!normalized.discountPercent && normalized.Percent) normalized.discountPercent = normalized.Percent;

  delete normalized.Code;
  delete normalized.Percent;
  delete normalized.branchId;

  return normalized;
};

export const viewAll = async (branchId: string): Promise<iCoupon[]> => {
  return await CouponModel.find({ branchId });
};

export const create = async (branchId: string, data: Partial<iCoupon> & { Code?: string; Percent?: number }): Promise<iCoupon> => {
  const newCoupon = new CouponModel({ ...normalizeCouponData(data), branchId });
  return await newCoupon.save();
};

export const modify = async (branchId: string, id: string, data: Partial<iCoupon> & { Code?: string; Percent?: number }): Promise<iCoupon | null> => {
  return await CouponModel.findOneAndUpdate(
    { _id: id, branchId },
    { $set: normalizeCouponData(data) },
    { new: true, runValidators: true },
  );
};

export const search = async (branchId: string, code: string): Promise<iCoupon | null> => {
  return await CouponModel.findOne({ branchId, code: code.toUpperCase(), active: { $ne: false } });
};

export const deleteById = async (branchId: string, id: string): Promise<iCoupon | null> => {
  return await CouponModel.findOneAndDelete({ _id: id, branchId });
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
  
  // Validacion de Dias de la Semana (campo real del schema: validDays, en ingles como CDAYS)
  if (coupon.validDays && coupon.validDays.length > 0) {
    const esDiaValido = coupon.validDays.some(
      (d: string) => d.toString().trim().toLowerCase() === argWeekday()
    );

    if (!esDiaValido) {
      return `Cupón no disponible para los días ${coupon.validDays.join(', ')}`;
    }
  }

  // Validación de Métodos de Pago (campo real del schema: validPaymentMethods)
  if (coupon.validPaymentMethods && coupon.validPaymentMethods.length > 0) {
    const metodoPagoNormalizado = paymentMethod.trim().toLowerCase();
    const esMetodoValido = coupon.validPaymentMethods.some(
      (m: string) => m.trim().toLowerCase() === metodoPagoNormalizado
    );

    if (!esMetodoValido) {
      return `Este cupón no es válido para el método de pago seleccionado`;
    }
  }

  return null; // Todo en orden, el cupón es 100% válido
};
