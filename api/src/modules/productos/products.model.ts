import mongoose, { Schema, Document } from 'mongoose';

export interface iProducto extends Document {
  branchId: mongoose.Types.ObjectId;
  title: string;
  price: number;
  description?: string;
  image?: string;
  category: mongoose.Types.ObjectId;
  active: boolean;
  deleted: boolean;
  controlStock: boolean;
  stock: number;
}

const ProductoSchema = new Schema<iProducto>({
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  title: {
    type: String,
    required: [true, 'El titulo es obligatorio'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: 0,
  },
  description: {
    type: String,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categoria',
    required: [true, 'La categoria es obligatoria'],
  },
  image: {
    type: String,
  },
  active: {
    type: Boolean,
    default: true,
  },
  deleted: { type: Boolean, default: false },
  controlStock: {
    type: Boolean,
    default: false,
  },
  stock: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
});

ProductoSchema.index({ branchId: 1, active: 1, category: 1 });

export const ProductModel = mongoose.model<iProducto>('Producto', ProductoSchema);
