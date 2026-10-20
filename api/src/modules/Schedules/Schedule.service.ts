import { ConfigModel, IDaySchedule, IConfig } from './Schedule.module';
import { BranchModel } from '../branches/branch.model';
import { AppError } from '../../utils/AppError';
import { localDate } from '../../utils/branchTime';

// Reemplazo robusto para limpiar tildes (Unicode block de diacríticos)
const normalizeDayName = (value?: string) =>
  value?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export const checkStoreStatus = async (branchId: string) => {
  const [config, branch] = await Promise.all([
    ConfigModel.getOrCreateConfig(branchId),
    BranchModel.findById(branchId).select('timezone').lean(),
  ]);
  if (!branch) throw new AppError(404, 'Sucursal no encontrada');
  const isEmergencyClosed = config.isEmergencyClosed || config.isAllClose;

  const baseResponse = {
    isEmergencyClosed,
    banner: config.banner ?? '',
  };

  if (isEmergencyClosed) {
    return {
      ...baseResponse,
      isOpen: false,
      message: config.emergencyMessage || 'Negocio cerrado',
      schedule: null,
    };
  }

  const now = new Date();
  const currentTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: branch.timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(now);
  const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  const dayIndex = new Date(`${localDate(branch.timezone, now)}T12:00:00Z`).getUTCDay();
  const dayName = weekdays[dayIndex];
  const previousDayName = weekdays[(dayIndex + 6) % 7];

  const todaySchedule = config.dailySchedule.find(
    (schedule) => normalizeDayName(schedule.day) === normalizeDayName(dayName),
  );

  const previousSchedule = config.dailySchedule.find(
    (schedule) => normalizeDayName(schedule.day) === normalizeDayName(previousDayName),
  );
  const openFromPreviousDay = !!previousSchedule?.isStoreOpen
    && previousSchedule.openTime > previousSchedule.closeTime
    && currentTime <= previousSchedule.closeTime;
  const openToday = !!todaySchedule?.isStoreOpen && (
    todaySchedule.openTime <= todaySchedule.closeTime
      ? currentTime >= todaySchedule.openTime && currentTime <= todaySchedule.closeTime
      : currentTime >= todaySchedule.openTime
  );

  if (!todaySchedule?.isStoreOpen && !openFromPreviousDay) {
    return {
      ...baseResponse,
      isOpen: false,
      message: 'Hoy el local permanece cerrado',
      schedule: todaySchedule ?? null,
    };
  }

  // 🚪 VALIDACIÓN DE APERTURA GENERAL Y DE RANGOS DE HORARIO
  const isOpen = config.isOpen && (openToday || openFromPreviousDay);

  return {
    ...baseResponse,
    isOpen,
    message: isOpen ? 'Estamos cocinando!' : `Abrimos a las ${todaySchedule?.openTime ?? 'consultar'}`,
    schedule: openFromPreviousDay ? previousSchedule : todaySchedule,
  };
};

export const updateBanner = async (branchId: string, bannerUrl: string): Promise<IConfig> => {
  const config = await ConfigModel.getOrCreateConfig(branchId);
  config.banner = bannerUrl;
  return await config.save();
};

export const closeStore = async (branchId: string): Promise<IConfig | null> => {
  const config = await ConfigModel.getOrCreateConfig(branchId);
  if (!config) return null;

  const nextStatus = !(config.isEmergencyClosed || config.isAllClose);
  config.isEmergencyClosed = nextStatus;
  config.isAllClose = nextStatus;
  return await config.save();
};

export const updateSchedule = async (branchId: string, updates: IDaySchedule[]): Promise<IConfig> => {
  const config = await ConfigModel.getOrCreateConfig(branchId);

  const updatesMap = new Map(updates.map(d => [normalizeDayName(d.day), d]));

  const merged = config.dailySchedule.map(existing =>
    updatesMap.get(normalizeDayName(existing.day)) ?? existing
  );

  for (const update of updates) {
    const alreadyExists = config.dailySchedule.some(
      d => normalizeDayName(d.day) === normalizeDayName(update.day)
    );
    if (!alreadyExists) merged.push(update);
  }

  config.dailySchedule = merged as typeof config.dailySchedule;
  return await config.save();
};
