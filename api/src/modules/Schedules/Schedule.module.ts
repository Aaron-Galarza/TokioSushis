import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDaySchedule {
  day: string;
  openTime: string;
  closeTime: string;
  isStoreOpen: boolean;
}

export interface IConfig extends Document {
  isOpen: boolean;
  isEmergencyClosed: boolean;
  emergencyMessage: string;
  pricePerKm: number;
  dailySchedule: IDaySchedule[];
  isAllClose: boolean;
}

const dayScheduleSchema = new Schema<IDaySchedule>({
  day: { type: String, required: true },
  openTime: { type: String, required: true },
  closeTime: { type: String, required: true },
  isStoreOpen: { type: Boolean, required: true },
}, { _id: false });

const configSchema = new Schema<IConfig>({
  isOpen: { type: Boolean, default: true },
  isEmergencyClosed: { type: Boolean, default: false },
  emergencyMessage: { type: String, default: '' },
  pricePerKm: { type: Number, default: 0, min: 0 },
  dailySchedule: [dayScheduleSchema],
  isAllClose: { type: Boolean, default: false },
}, { timestamps: true });

configSchema.statics.getOrCreateConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({
      isOpen: true,
      isEmergencyClosed: false,
      emergencyMessage: '',
      pricePerKm: Number(process.env.PRICE_PER_KM ?? 0),
      dailySchedule: [
        { day: 'Domingo', openTime: '20:00', closeTime: '23:00', isStoreOpen: true },
        { day: 'Lunes', openTime: '20:00', closeTime: '23:00', isStoreOpen: true },
        { day: 'Martes', openTime: '20:00', closeTime: '23:00', isStoreOpen: true },
        { day: 'Miercoles', openTime: '20:00', closeTime: '23:00', isStoreOpen: true },
        { day: 'Jueves', openTime: '20:00', closeTime: '23:00', isStoreOpen: true },
        { day: 'Viernes', openTime: '20:00', closeTime: '23:00', isStoreOpen: true },
        { day: 'Sabado', openTime: '20:00', closeTime: '23:59', isStoreOpen: true },
      ],
    });
  }
  return config;
};

interface IConfigModel extends Model<IConfig> {
  getOrCreateConfig(): Promise<IConfig>;
}

export const ConfigModel = mongoose.model<IConfig, IConfigModel>('Config', configSchema);
