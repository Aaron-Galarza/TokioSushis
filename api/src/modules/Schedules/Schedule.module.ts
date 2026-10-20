import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDaySchedule {
  day: string;
  openTime: string;
  closeTime: string;
  isStoreOpen: boolean;
}

export interface IConfig extends Document {
  branchId: mongoose.Types.ObjectId;
  isOpen: boolean;
  isEmergencyClosed: boolean;
  emergencyMessage: string;
  dailySchedule: IDaySchedule[];
  isAllClose: boolean;
  banner: string;
}

const dayScheduleSchema = new Schema<IDaySchedule>({
  day: { type: String, required: true },
  openTime: { type: String, required: true },
  closeTime: { type: String, required: true },
  isStoreOpen: { type: Boolean, required: true },
}, { _id: false });

const configSchema = new Schema<IConfig>({
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  isOpen: { type: Boolean, default: true },
  isEmergencyClosed: { type: Boolean, default: false },
  emergencyMessage: { type: String, default: '' },
  dailySchedule: [dayScheduleSchema],
  isAllClose: { type: Boolean, default: false },
  banner: { type: String, default: '' },
}, { timestamps: true });

configSchema.index({ branchId: 1 }, { unique: true });

configSchema.statics.getOrCreateConfig = async function (branchId: string) {
  return this.findOneAndUpdate(
    { branchId },
    { $setOnInsert: {
      branchId,
      isOpen: true,
      isEmergencyClosed: false,
      emergencyMessage: '',
      banner:'',
      dailySchedule: [
        { day: 'Domingo', openTime: '20:00', closeTime: '23:00', isStoreOpen: true },
        { day: 'Lunes', openTime: '20:00', closeTime: '23:00', isStoreOpen: true },
        { day: 'Martes', openTime: '20:00', closeTime: '23:00', isStoreOpen: true },
        { day: 'Miercoles', openTime: '20:00', closeTime: '23:00', isStoreOpen: true },
        { day: 'Jueves', openTime: '20:00', closeTime: '23:00', isStoreOpen: true },
        { day: 'Viernes', openTime: '20:00', closeTime: '23:00', isStoreOpen: true },
        { day: 'Sabado', openTime: '20:00', closeTime: '23:59', isStoreOpen: true },
      ],
    } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
};

interface IConfigModel extends Model<IConfig> {
  getOrCreateConfig(branchId: string): Promise<IConfig>;
}

export const ConfigModel = mongoose.model<IConfig, IConfigModel>('Config', configSchema);
