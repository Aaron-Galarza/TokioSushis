import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IKmRange {
  _id?: Types.ObjectId;
  maxKm: number;
  price: number;
}

export interface ISpecialZone {
  _id?: Types.ObjectId;
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  price: number;
}

export interface IDeliveryConfig extends Document {
  kmRanges: Types.DocumentArray<IKmRange & Document>;
  specialZones: Types.DocumentArray<ISpecialZone & Document>;
  extraRain: number;
  isRaining: boolean;
}

const kmRangeSchema = new Schema<IKmRange>({
  maxKm: { type: Number, required: true, min: 0 },
  price: { type: Number, required: true, min: 0 },
});

const specialZoneSchema = new Schema<ISpecialZone>({
  name: { type: String, required: true, uppercase: true, trim: true },
  lat: { type: Number, required: true, min: -90, max: 90 },
  lng: { type: Number, required: true, min: -180, max: 180 },
  radiusMeters: { type: Number, required: true, min: 1, default: 300 },
  price: { type: Number, required: true, min: 0 },
});

const deliveryConfigSchema = new Schema<IDeliveryConfig>({
  kmRanges: [kmRangeSchema],
  specialZones: [specialZoneSchema],
  extraRain: { type: Number, default: 0, min: 0 },
  isRaining: { type: Boolean, default: false },
}, { timestamps: true });

// Mantiene los rangos ordenados de menor a mayor automáticamente
deliveryConfigSchema.pre('save', function (this: IDeliveryConfig) {
  this.kmRanges.sort((a, b) => a.maxKm - b.maxKm);
});

deliveryConfigSchema.statics.getOrCreateConfig = async function () {
  let config = await this.findOne();
  if (config) return config;

  return await this.findOneAndUpdate(
    {},
    {
      $setOnInsert: {
        extraRain: 1000,
        isRaining: false,
        kmRanges: [
          { maxKm: 0.5, price: 2100 },
          { maxKm: 1.0, price: 2300 },
          { maxKm: 1.5, price: 2600 },
          { maxKm: 2.0, price: 2900 },
        ],
        specialZones: [
          { name: 'SHOPPING', lat: -27.4526, lng: -58.9696, radiusMeters: 400, price: 5500 },
          { name: 'RIVERA',   lat: -27.4321, lng: -58.9510, radiusMeters: 500, price: 6000 },
        ],
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

interface IDeliveryConfigModel extends mongoose.Model<IDeliveryConfig> {
  getOrCreateConfig(): Promise<IDeliveryConfig>;
}

export const DeliveryConfigModel = mongoose.model<IDeliveryConfig, IDeliveryConfigModel>('DeliveryConfig', deliveryConfigSchema);