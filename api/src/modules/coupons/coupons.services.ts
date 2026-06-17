import { iCoupon, CouponModel } from './coupons.model';

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
