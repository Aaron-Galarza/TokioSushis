import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IKmRange {
  _id?: Types.ObjectId;
  maxKm: number;
  price: number;
}

export interface IDeliveryConfig extends Document {
  kmRanges: Types.DocumentArray<IKmRange & Document>;
  extraRain: number;
  isRaining: boolean;
}

const kmRangeSchema = new Schema<IKmRange>({
  maxKm: { type: Number, required: true, min: 0 },
  price: { type: Number, required: true, min: 0 },
});

const deliveryConfigSchema = new Schema<IDeliveryConfig>({
  kmRanges:  [kmRangeSchema],
  extraRain: { type: Number, default: 0, min: 0 },
  isRaining: { type: Boolean, default: false },
}, { timestamps: true });

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
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

interface IDeliveryConfigModel extends mongoose.Model<IDeliveryConfig> {
  getOrCreateConfig(): Promise<IDeliveryConfig>;
}

export const DeliveryConfigModel = mongoose.model<IDeliveryConfig, IDeliveryConfigModel>('DeliveryConfig', deliveryConfigSchema);