import { AppError } from './AppError';

const getStoreCoordinates = () => {
  const storeLat = Number(process.env.STORE_LAT);
  const storeLng = Number(process.env.STORE_LNG);

  if (!Number.isFinite(storeLat) || !Number.isFinite(storeLng)) {
    throw new AppError(500, 'Faltan las coordenadas del local');
  }

  return { storeLat, storeLng };
};
export const calculateDistanceKm = async (clientLat: number, clientLng: number): Promise<number> => {
  const token = process.env.MAPBOX_TOKEN;
  if (!token) {
    throw new AppError(500, 'Falta MAPBOX_TOKEN en el servidor');
  }

  // 1. Obtener coordenadas del local y limpiar cualquier espacio fantasma
  const storeLatStr = String(process.env.STORE_LAT).trim();
  const storeLngStr = String(process.env.STORE_LNG).trim();
  
  const clientLatStr = String(clientLat).trim();
  const clientLngStr = String(clientLng).trim();

  // 2. Construir la cadena de coordenadas de forma ultra limpia (LNG,LAT)
  const pathCoordinates = `${storeLngStr},${storeLatStr};${clientLngStr},${clientLatStr}`;

  // 3. Crear la URL base de Mapbox Directions
  const baseUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${pathCoordinates}`;
  const url = new URL(baseUrl);

  // 4. Inyectar los parámetros de búsqueda de forma segura
  url.searchParams.set('access_token', token);
  url.searchParams.set('geometries', 'geojson');
  url.searchParams.set('overview', 'false'); // overview=false hace que devuelva solo el resumen de metros

  let response: Response;
  try {
    response = await fetch(url.toString()); // Forzamos el parseo a string limpio
  } catch (error) {
    throw new AppError(503, 'No se pudo consultar el servicio de mapas');
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[MAPBOX_API_ERROR]', errorText); // Dejamos registro en la consola del back
    throw new AppError(503, 'No se pudo calcular la distancia de envio');
  }

  const data = await response.json();
  const distanceMeters = data?.routes?.[0]?.distance;

  if (typeof distanceMeters !== 'number') {
    throw new AppError(400, 'No se encontro una ruta valida para esas coordenadas');
  }

  // Convertir metros a KM y redondear a 2 decimales
  return Math.round((distanceMeters / 1000) * 100) / 100;
};