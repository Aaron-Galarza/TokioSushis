import mongoose, { Schema, Document } from 'mongoose';

export interface IOption extends Document {
  nombre: string;
  descripcion?: string;
  precio: number;
  activo: boolean;
  disponible: boolean;
  orden: number;
}

const schema = new Schema<IOption>({
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String },
  precio: { type: Number, required: true, min: 0, default: 0 },
  activo: { type: Boolean, default: true, index: true },
  disponible: { type: Boolean, default: true },
  orden: { type: Number, default: 0 },
}, { timestamps: true });

export const OptionModel = mongoose.model<IOption>('Opcion', schema);
