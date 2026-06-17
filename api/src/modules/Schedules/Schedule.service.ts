import { ConfigModel, IDaySchedule, IConfig } from './Schedule.module';

const normalizeDayName = (value?: string) =>
  value?.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export const checkStoreStatus = async () => {
  const config = await ConfigModel.getOrCreateConfig();
  const isEmergencyClosed = config.isEmergencyClosed || config.isAllClose;

  if (isEmergencyClosed) {
    return {
      isOpen: false,
      isEmergencyClosed: true,
      message: config.emergencyMessage || 'Negocio cerrado',
      schedule: null,
      pricePerKm: config.pricePerKm ?? 0,
    };
  }

  const now = new Date();
  const formatter = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);

  const dayName = parts.find((p) => p.type === 'weekday')?.value;
  const hour = parts.find((p) => p.type === 'hour')?.value;
  const minute = parts.find((p) => p.type === 'minute')?.value;
  const currentTime = `${hour}:${minute}`;

  const todaySchedule = config.dailySchedule.find(
    (schedule) => normalizeDayName(schedule.day) === normalizeDayName(dayName),
  );

  if (!todaySchedule || !todaySchedule.isStoreOpen) {
    return {
      isOpen: false,
      isEmergencyClosed: false,
      message: 'Hoy el local permanece cerrado',
      schedule: todaySchedule ?? null,
      pricePerKm: config.pricePerKm ?? 0,
    };
  }

  const isOpen = config.isOpen && currentTime >= todaySchedule.openTime && currentTime <= todaySchedule.closeTime;

  return {
    isOpen,
    isEmergencyClosed: false,
    message: isOpen ? 'Estamos cocinando!' : `Abrimos a las ${todaySchedule.openTime}`,
    schedule: todaySchedule,
    pricePerKm: config.pricePerKm ?? 0,
  };
};

export const closeStore = async (): Promise<IConfig | null> => {
  const config = await ConfigModel.getOrCreateConfig();
  if (!config) return null;

  const nextStatus = !(config.isEmergencyClosed || config.isAllClose);
  config.isEmergencyClosed = nextStatus;
  config.isAllClose = nextStatus;
  return await config.save();
};

export const updateDelivery = async (pricePerKm: number): Promise<IConfig> => {
  const config = await ConfigModel.getOrCreateConfig();
  config.pricePerKm = pricePerKm;
  return await config.save();
};

export const updateSchedule = async (updates: IDaySchedule[]): Promise<IConfig> => {
  const config = await ConfigModel.getOrCreateConfig();

  // Index incoming updates by normalized day name for O(1) lookup
  const updatesMap = new Map(updates.map(d => [normalizeDayName(d.day), d]));

  // Replace matching days, keep the rest untouched
  const merged = config.dailySchedule.map(existing =>
    updatesMap.get(normalizeDayName(existing.day)) ?? existing
  );

  // Append days that don't exist yet in the schedule
  for (const update of updates) {
    const alreadyExists = config.dailySchedule.some(
      d => normalizeDayName(d.day) === normalizeDayName(update.day)
    );
    if (!alreadyExists) merged.push(update);
  }

  config.dailySchedule = merged as typeof config.dailySchedule;
  return await config.save();
};
