import mongoose, { Document, Schema } from 'mongoose';

export interface IBranch extends Document {
  name: string;
  slug: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  timezone: string;
  phone?: string;
  whatsappPhone?: string;
  active: boolean;
}

const branchSchema = new Schema<IBranch>({
  name: { type: String, required: true, trim: true },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    immutable: true,
    match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  },
  address: { type: String, required: true, trim: true },
  coordinates: {
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
  },
  timezone: { type: String, required: true, default: 'America/Argentina/Buenos_Aires' },
  phone: { type: String, trim: true },
  whatsappPhone: { type: String, trim: true },
  active: { type: Boolean, required: true, default: true },
}, { timestamps: true });

export const BranchModel = mongoose.model<IBranch>('Branch', branchSchema);
