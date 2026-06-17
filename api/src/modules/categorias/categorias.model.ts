import mongoose, { Schema, Document } from 'mongoose';

export interface iCategoria extends Document {
  name: string;
  order: number;
  active: boolean;
}

const CategoriaSchema = new Schema<iCategoria>({
  name: {
    type: String,
    required: [true, 'El nombre de la categoria es obligatorio'],
    unique: true,
    trim: true,
  },
  order: {
    type: Number,
    default: 0,
    index: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

export const CategoriaModel = mongoose.model<iCategoria>('Categoria', CategoriaSchema);
