import mongoose, { Schema, Document } from 'mongoose';

export interface iAdicional extends Document {
  title: string;
  price: number;
  category?: mongoose.Types.ObjectId;
  active: boolean;
}

const AdicionalSchema = new Schema<iAdicional>({
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
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categoria',
    default: null,
    index: true,
  },
  active: {
    type: Boolean,
    default: true,
    index: true,
  },
}, { timestamps: true });

export const AdicionalModel = mongoose.model<iAdicional>('Adicional', AdicionalSchema);
