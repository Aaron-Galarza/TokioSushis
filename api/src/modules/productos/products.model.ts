import mongoose, { Schema, Document } from 'mongoose';

export interface iProducto extends Document {
  title: string;
  price: number;
  description?: string;
  image?: string;
  category: mongoose.Types.ObjectId;
  active: boolean;
  controlStock:boolean;
  stock:number
  tipoProducto: 'simple' | 'configurable';
  gruposOpciones: Array<{
    grupo: mongoose.Types.ObjectId;
    orden: number;
    obligatorio?: boolean | null;
    minimo?: number | null;
    maximo?: number | null;
    ingredientes: mongoose.Types.ObjectId[];
  }>;
}

const ProductGroupSchema = new Schema({
  grupo: { type: Schema.Types.ObjectId, ref: 'GrupoOpciones', required: true },
  orden: { type: Number, default: 0 },
  obligatorio: { type: Boolean, default: null },
  minimo: { type: Number, default: null, min: 0 },
  maximo: { type: Number, default: null, min: 1 },
  ingredientes: [{ type: Schema.Types.ObjectId, ref: 'Opcion' }],
}, { _id: false });

const ProductoSchema = new Schema<iProducto>({
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
    index: true,
  },
  image: {
    type: String,
  },
  active: {
    type: Boolean,
    default: true,
    index: true,
  },
  controlStock: {
    type: Boolean,
    default: false
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  tipoProducto: { type: String, enum: ['simple', 'configurable'], default: 'simple' },
  gruposOpciones: { type: [ProductGroupSchema], default: [] },
}, {
  timestamps: true,
});

export const ProductModel = mongoose.model<iProducto>('Producto', ProductoSchema);
