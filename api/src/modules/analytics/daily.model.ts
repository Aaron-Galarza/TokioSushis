import mongoose, { Schema, Document } from 'mongoose';

// Cada producto vendido en el día
interface IProductEntry {
  qty: number;
  title: string;
}

export interface IDailyAnalytics extends Document {
  date: string; // "YYYY-MM-DD"
  total: number;
  efectivo: number;
  trans: number;
  entregados: number;
  products: Map<string, IProductEntry>;
}

const dailyAnalyticsSchema = new Schema<IDailyAnalytics>(
  {
    date: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    total: { type: Number, default: 0 },
    efectivo: { type: Number, default: 0 },
    trans: { type: Number, default: 0 },
    entregados: { type: Number, default: 0 },
    products: {
      type: Map,
      of: new Schema(
        {
          qty: { type: Number, default: 0 },
          title: { type: String },
        },
        { _id: false }
      ),
      default: {},
    },
  },
  { timestamps: true }
);

export const DailyAnalyticsModel = mongoose.model<IDailyAnalytics>(
  'AnalyticsDaily',
  dailyAnalyticsSchema
);