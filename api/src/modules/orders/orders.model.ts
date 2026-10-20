import mongoose, { Schema, Document } from 'mongoose';

export type OrderStatus = 'pending' | 'in-preparation' | 'ready' | 'delivered' | 'cancelled';
export const validOrderStatus: OrderStatus[] = ['pending', 'in-preparation', 'ready', 'delivered', 'cancelled'];

export interface iCartAddon {
  addonId: string;
  title: string;
  name?: string;
  price: number;
  quantity: number;
}

export interface iCartSelection {
  stepId: string;
  stepLabel?: string;
  optionId: string;
  label: string;
  price?: number;
  kind?: 'selection' | 'exclusion';
}

export interface iCartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  addons?: iCartAddon[];
  configSummary?: string;
  selections?: iCartSelection[];
}

export type PaymentMethod = 'cash' | 'debito' | 'credito' | 'transferencia';
export const validPaymentMethods: PaymentMethod[] = ['cash', 'debito', 'credito', 'transferencia'];

export interface iOrder extends Document {
  branchId: mongoose.Types.ObjectId;
  idempotencyKey?: string;
  requestHash?: string;
  customer: {
    name: string;
    phone: string;
    address?: string;
  };
  items: iCartItem[];
  notes?: string;
  couponCode?: string;
  discountPercent: number;
  subtotal: number;
  deliveryType: 'pickup' | 'delivery';
  paymentMethod: PaymentMethod;
  deliveryCost: number;
  surcharge: number; // NUEVO: Monto exacto del recargo por tarjeta de crédito
  delivery?: {
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    distanceKm?: number;
  };
  total: number;
  status: OrderStatus;
  deleted: boolean;
  createdAt: Date;
}

const CartAddonSchema = new Schema<iCartAddon>({
  addonId: { type: String, required: true },
  title: { type: String, required: true },
  name: { type: String },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, max: 10 },
}, { _id: false });

const CartSelectionSchema = new Schema<iCartSelection>({
  stepId: { type: String, required: true },
  stepLabel: { type: String },
  optionId: { type: String, required: true },
  label: { type: String, required: true },
  price: { type: Number, default: 0 },
  kind: { type: String, enum: ['selection', 'exclusion'] },
}, { _id: false });

const CartItemSchema = new Schema<iCartItem>({
  productId: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  addons: { type: [CartAddonSchema], default: [] },
  configSummary: { type: String },
  selections: { type: [CartSelectionSchema], default: undefined },
}, { _id: false });

const OrderSchema = new Schema<iOrder>({
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  idempotencyKey: { type: String },
  requestHash: { type: String },
  customer: {
    name: { type: String, required: [true, 'El nombre del cliente es obligatorio'] },
    phone: { type: String, required: [true, 'El telefono del cliente es obligatorio'] },
    address: { type: String },
  },
  items: { type: [CartItemSchema], required: true },
  notes: { 
    type: String, 
    trim: true,
    maxlength: [60, 'Las notas no pueden superar los 60 caracteres'], 
    default: ''
  },
  couponCode: { type: String },
  discountPercent: { type: Number, default: 0, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
  deliveryType: { type: String, enum: ['pickup', 'delivery'], required: true },
  paymentMethod: { type: String, enum: validPaymentMethods, required: true },
  deliveryCost: { type: Number, default: 0, min: 0 },
  surcharge: { type: Number, default: 0, min: 0 }, // NUEVO: Guardamos el recargo en la BD
  delivery: {
    address: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    distanceKm: { type: Number },
  },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: validOrderStatus, default: 'pending' },
  deleted: { type: Boolean, default: false },
}, { timestamps: true });

OrderSchema.index({ branchId: 1, createdAt: -1 });
OrderSchema.index({ branchId: 1, status: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ branchId: 1, idempotencyKey: 1 }, {
  unique: true,
  partialFilterExpression: { idempotencyKey: { $type: 'string' } },
});

export const OrderModel = mongoose.model<iOrder>('Order', OrderSchema);
