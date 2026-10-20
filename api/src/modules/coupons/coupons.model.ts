import mongoose, { Schema, Document } from 'mongoose';

export interface iCoupon extends Document {
  branchId: mongoose.Types.ObjectId;
  code: string;
  discountPercent: number;
  active: boolean;
  validDays: string[];
  validPaymentMethods: string[];
}

const CouponSchema = new Schema<iCoupon>({
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  code: {
    type: String,
    required: [true, 'El codigo del cupon es obligatorio'],
    trim: true,
    uppercase: true,
  },
  discountPercent: {
    type: Number,
    required: [true, 'El porcentaje es obligatorio'],
    min: [1, 'El porcentaje debe ser mayor a 0'],
    max: [100, 'El porcentaje no puede superar 100'],
  },
  active: {
    type: Boolean,
    default: true,
  },
  validDays: {
    type: [String],
    default: [],
  },
  validPaymentMethods: {
    type: [String],
    enum: ['cash', 'debito', 'credito', 'transferencia'],
    default: [],
  },
}, { timestamps: true });

CouponSchema.index({ branchId: 1, code: 1 }, { unique: true });
CouponSchema.index({ branchId: 1, active: 1 });

export const CouponModel = mongoose.model<iCoupon>('Coupon', CouponSchema);
