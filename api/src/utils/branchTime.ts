import { Range } from './dateRange';

const partsInZone = (date: Date, timezone: string) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value('year'), month: value('month'), day: value('day'),
    hour: value('hour'), minute: value('minute'), second: value('second') };
};

export const localDate = (timezone: string, date = new Date()): string => {
  const { year, month, day } = partsInZone(date, timezone);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const localWeekday = (timezone: string, date = new Date()): string =>
  new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'long' }).format(date).toLowerCase();

export const rangeStart = (today: string, range: Range): string => {
  if (range === 'hoy') return today;
  const day = new Date(`${today}T12:00:00.000Z`);
  if (range === 'ayer') day.setUTCDate(day.getUTCDate() - 1);
  if (range === 'semana') day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  if (range === 'mes') day.setUTCDate(1);
  return day.toISOString().slice(0, 10);
};

export const startOfLocalDayUtc = (day: string, timezone: string): Date => {
  const [year, month, date] = day.split('-').map(Number);
  const target = Date.UTC(year, month - 1, date);
  let utc = target;
  for (let i = 0; i < 3; i++) {
    const local = partsInZone(new Date(utc), timezone);
    const interpreted = Date.UTC(local.year, local.month - 1, local.day,
      local.hour, local.minute, local.second);
    utc = target - (interpreted - utc);
  }
  return new Date(utc);
};

export const nextDay = (day: string): string => {
  const date = new Date(`${day}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
};
