export interface GeocodeResult {
  placeName: string;
  lat: number;
  lng: number;
}

// ─── Cache en memoria con TTL (sin escrituras a la BD) ──────────────────────
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días
const cache = new Map<string, { expiresAt: number; results: GeocodeResult[] }>();

// ─── Budget guard: tope mensual para no pasarse de la capa gratuita ──────────
const MONTHLY_CAP = 8000;
let monthlyCount = 0;
let monthlyKey = '';

const getMonthKey = (): string => new Date().toISOString().slice(0, 7); // "2026-08"

const canConsumeBudget = (): boolean => {
  const mk = getMonthKey();
  if (mk !== monthlyKey) {
    monthlyKey = mk;
    monthlyCount = 0;
  }
  return monthlyCount < MONTHLY_CAP;
};

// Normaliza para que "Av Alvear 880" y "av alvear 880" compartan cache
const normalizeQuery = (q: string): string =>
  q
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const googleGeocode = async (query: string): Promise<GeocodeResult[]> => {
  const key = normalizeQuery(query);

  const cached = cache.get(key);
  if (cached) {
    if (cached.expiresAt > Date.now()) {
      console.log(`[GOOGLE_GEOCODING] cache hit: "${key}"`);
      return cached.results;
    }
    cache.delete(key);
  }

  if (!canConsumeBudget()) {
    console.warn('[GOOGLE_GEOCODING] Tope mensual alcanzado, se omite la consulta');
    return [];
  }

  const apiKey = process.env.GOOGLE_GEOCODING_KEY;
  if (!apiKey) {
    console.error('[GOOGLE_GEOCODING] Falta GOOGLE_GEOCODING_KEY en el entorno');
    return [];
  }

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', query.trim());
  url.searchParams.set('key', apiKey);
  url.searchParams.set('region', 'ar');
  url.searchParams.set('language', 'es');
  url.searchParams.set('components', 'country:AR');
  // bounds del Gran Resistencia (suroeste,noreste en lat,lng)
  url.searchParams.set('bounds', '-27.4915,-59.0526|-27.4022,-58.8953');

  let response: Response;
  try {
    monthlyCount += 1;
    console.log(`[GOOGLE_GEOCODING] consultando (${monthlyCount}/${MONTHLY_CAP}): "${query.trim()}"`);
    response = await fetch(url.toString());
  } catch (error) {
    console.error('[GOOGLE_GEOCODING] Error de red:', error);
    return [];
  }

  const data: any = await response.json();

  if (data.status === 'ZERO_RESULTS') {
    cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, results: [] });
    return [];
  }

  if (data.status !== 'OK') {
    console.error('[GOOGLE_GEOCODING] status:', data.status, data.error_message || '');
    return [];
  }

  const results: GeocodeResult[] = (data.results || [])
    .map((r: any) => ({
      placeName: r.formatted_address,
      lat: r.geometry?.location?.lat,
      lng: r.geometry?.location?.lng,
    }))
    .filter((r: GeocodeResult) => typeof r.lat === 'number' && typeof r.lng === 'number');

  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, results });
  return results;
};
