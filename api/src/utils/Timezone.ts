const TZ = 'America/Argentina/Buenos_Aires';

/** Devuelve "YYYY-MM-DD" en hora Argentina. Funciona en cualquier servidor sin importar su timezone. */
export const argDate = (d: Date = new Date()): string =>
  d.toLocaleDateString('en-CA', { timeZone: TZ });

/** Medianoche Argentina → Date UTC. Argentina no tiene horario de verano, siempre es +3h. */
export const argToUTC = (dateStr: string): Date =>
  new Date(dateStr + 'T03:00:00.000Z');