import mongoose, { Schema, Document } from 'mongoose';

export type ConfigStepType = 'single' | 'multiple';
export type ConfigStepMode = 'absolute' | 'delta';
export type ConfigOptionKind = 'selection' | 'exclusion';

export interface iConfigOption {
  id: string;
  label: string;
  description?: string;
  price: number;
  kind: ConfigOptionKind;
  isExtra?: boolean;
  defaultSelected?: boolean;
  active?: boolean;
}

export interface iConfigStep {
  id: string;
  label: string;
  title: string;
  description?: string;
  type: ConfigStepType;
  mode: ConfigStepMode;
  min: number;
  max: number;
  required: boolean;
  options: iConfigOption[];
}

export interface iConfigurator {
  enabled: boolean;
  key: string;
  steps: iConfigStep[];
}

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
  configurator?: iConfigurator;
}

const ConfigOptionSchema = new Schema<iConfigOption>({
  id: { type: String, required: true, trim: true },
  label: { type: String, required: true, trim: true },
  description: { type: String },
  price: { type: Number, default: 0, min: 0 },
  kind: { type: String, enum: ['selection', 'exclusion'], default: 'selection' },
  isExtra: { type: Boolean, default: false },
  defaultSelected: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
}, { _id: false });

const ConfigStepSchema = new Schema<iConfigStep>({
  id: { type: String, required: true, trim: true },
  label: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  description: { type: String },
  type: { type: String, enum: ['single', 'multiple'], default: 'single' },
  mode: { type: String, enum: ['absolute', 'delta'], default: 'delta' },
  min: { type: Number, default: 0, min: 0 },
  max: { type: Number, default: 0, min: 0 },
  required: { type: Boolean, default: false },
  options: { type: [ConfigOptionSchema], default: [] },
}, { _id: false });

const ConfiguratorSchema = new Schema<iConfigurator>({
  enabled: { type: Boolean, default: false },
  key: { type: String, default: '', trim: true },
  steps: { type: [ConfigStepSchema], default: [] },
}, { _id: false });

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
  configurator: {
    type: ConfiguratorSchema,
    default: undefined,
  },
}, {
  timestamps: true,
});

ProductoSchema.index({ branchId: 1, active: 1, category: 1 });

export const ProductModel = mongoose.model<iProducto>('Producto', ProductoSchema);
