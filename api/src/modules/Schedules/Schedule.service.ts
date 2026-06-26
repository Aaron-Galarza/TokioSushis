import { ConfigModel, IDaySchedule, IConfig } from './Schedule.module';

// Reemplazo robusto para limpiar tildes (Unicode block de diacríticos)
const normalizeDayName = (value?: string) =>
  value?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export const checkStoreStatus = async () => {
  const config = await ConfigModel.getOrCreateConfig();
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

  // 🕒 OBTENER TIEMPO SEGURO EN ARGENTINA
  const now = new Date();
  
  // Convertimos de forma exacta la fecha actual al huso de Argentina
  const argString = now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' });
  const argDate = new Date(argString);

  // Extraemos las variables numéricas reales de forma nativa
  const hourNum = argDate.getHours();
  const minuteNum = argDate.getMinutes();
  
  // Armamos el string garantizando que vaya estrictamente de "00:00" a "23:59"
  const currentTime = `${hourNum.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')}`;

  // Obtenemos el nombre del día en español utilizando la fecha ya adaptada a Argentina
  const dayFormatter = new Intl.DateTimeFormat('es-AR', { weekday: 'long' });
  const dayName = dayFormatter.format(argDate);

  const todaySchedule = config.dailySchedule.find(
    (schedule) => normalizeDayName(schedule.day) === normalizeDayName(dayName),
  );

  if (!todaySchedule || !todaySchedule.isStoreOpen) {
    return {
      ...baseResponse,
      isOpen: false,
      message: 'Hoy el local permanece cerrado',
      schedule: todaySchedule ?? null,
    };
  }

  // 🚪 VALIDACIÓN DE APERTURA GENERAL Y DE RANGOS DE HORARIO
  const isOpen = config.isOpen && currentTime >= todaySchedule.openTime && currentTime <= todaySchedule.closeTime;

  return {
    ...baseResponse,
    isOpen,
    message: isOpen ? 'Estamos cocinando!' : `Abrimos a las ${todaySchedule.openTime}`,
    schedule: todaySchedule,
  };
};

export const updateBanner = async (bannerUrl: string): Promise<IConfig> => {
  const config = await ConfigModel.getOrCreateConfig();
  config.banner = bannerUrl;
  return await config.save();
};

export const closeStore = async (): Promise<IConfig | null> => {
  const config = await ConfigModel.getOrCreateConfig();
  if (!config) return null;

  const nextStatus = !(config.isEmergencyClosed || config.isAllClose);
  config.isEmergencyClosed = nextStatus;
  config.isAllClose = nextStatus;
  return await config.save();
};

export const updateSchedule = async (updates: IDaySchedule[]): Promise<IConfig> => {
  const config = await ConfigModel.getOrCreateConfig();

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