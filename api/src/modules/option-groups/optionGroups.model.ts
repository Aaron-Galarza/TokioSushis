import mongoose, { Schema, Document } from 'mongoose';

export interface IGroupOption {
  ingrediente: mongoose.Types.ObjectId;
  orden: number;
  activo: boolean;
  permiteCantidad: boolean;
  cantidadMaxima: number;
  precioEspecial?: number | null;
}
export interface IOptionGroup extends Document {
  nombre: string;
  descripcion?: string;
  tipo: 'unico' | 'multiple';
  obligatorio: boolean;
  minimo: number;
  maximo: number;
  activo: boolean;
  ingredientes: IGroupOption[];
}
const groupOptionSchema = new Schema<IGroupOption>({
  ingrediente: { type: Schema.Types.ObjectId, ref: 'Opcion', required: true },
  orden: { type: Number, default: 0 },
  activo: { type: Boolean, default: true },
  permiteCantidad: { type: Boolean, default: false },
  cantidadMaxima: { type: Number, default: 1, min: 1 },
  precioEspecial: { type: Number, default: null, min: 0 },
}, { _id: false });
const schema = new Schema<IOptionGroup>({
  nombre: { type: String, required: true, trim: true },
  descripcion: String,
  tipo: { type: String, enum: ['unico', 'multiple'], default: 'unico' },
  obligatorio: { type: Boolean, default: false },
  minimo: { type: Number, default: 0, min: 0 },
  maximo: { type: Number, default: 1, min: 1 },
  activo: { type: Boolean, default: true, index: true },
  ingredientes: { type: [groupOptionSchema], default: [] },
}, { timestamps: true });
export const OptionGroupModel = mongoose.model<IOptionGroup>('GrupoOpciones', schema);
