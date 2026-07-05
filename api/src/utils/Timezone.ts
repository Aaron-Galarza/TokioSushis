const TZ = 'America/Argentina/Buenos_Aires';

/** Devuelve "YYYY-MM-DD" en hora Argentina. Funciona en cualquier servidor sin importar su timezone. */
export const argDate = (d: Date = new Date()): string =>
  d.toLocaleDateString('en-CA', { timeZone: TZ });

/** Medianoche Argentina → Date UTC. Argentina no tiene horario de verano, siempre es +3h. */
export const argToUTC = (dateStr: string): Date =>
  new Date(dateStr + 'T03:00:00.000Z');

/** Día actual en Argentina como clave en inglés (ej: "monday"), compatible con CDAYS/validDays. */
export const argWeekday = (d: Date = new Date()): string =>
  new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'long' }).format(d).toLowerCase();