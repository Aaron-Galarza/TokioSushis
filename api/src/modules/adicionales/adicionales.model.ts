import mongoose, { Schema, Document } from 'mongoose';

export interface iAdicional extends Document {
  branchId: mongoose.Types.ObjectId;
  title: string;
  price: number;
  categories?: mongoose.Types.ObjectId[];
  legacyOrphanCategoryIds?: mongoose.Types.ObjectId[];
  active: boolean;
}

const AdicionalSchema = new Schema<iAdicional>({
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  title: {
    type: String,
    required: [true, 'El nombre del adicional es obligatorio'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: 0,
  },
  categories: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Categoria'
    }],
    default: [],
  },
  legacyOrphanCategoryIds: [{ type: mongoose.Schema.Types.ObjectId }],
  active: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

AdicionalSchema.index({ branchId: 1, active: 1 });
AdicionalSchema.index({ branchId: 1, categories: 1 });

export const AdicionalModel = mongoose.model<iAdicional>('Adicional', AdicionalSchema);
