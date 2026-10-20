import mongoose, { Schema, Document } from 'mongoose';

export interface iCategoria extends Document {
  branchId: mongoose.Types.ObjectId;
  name: string;
  order: number;
  active: boolean;
  icon?: string;
}

const CategoriaSchema = new Schema<iCategoria>({
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  name: {
    type: String,
    required: [true, 'El nombre de la categoria es obligatorio'],
    trim: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  active: {
    type: Boolean,
    default: true,
  },
  icon: {
    type: String,
    default: '',
  },
}, { timestamps: true });

CategoriaSchema.index({ branchId: 1, name: 1 }, { unique: true });
CategoriaSchema.index({ branchId: 1, active: 1, order: 1 });

export const CategoriaModel = mongoose.model<iCategoria>('Categoria', CategoriaSchema);
