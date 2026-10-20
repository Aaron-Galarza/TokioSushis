'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';
import { useBranchStore } from '@/stores/branch.store';

export interface AddressResult {
  placeName: string;
  /** Opcional: cuando Mapbox no encuentra la dirección, el usuario puede confirmar el texto sin coordenadas */
  lat?: number;
  lng?: number;
}

// 🛟 Fallback con Google Geocoding a través del backend (la key queda en el server).
// Solo se llama cuando Mapbox no encontró nada y la consulta tiene altura,
// para ahorrar la cuota gratuita de Google.
const fetchGoogleGeocode = async (query: string, signal: AbortSignal): Promise<AddressResult[]> => {
  try {
    const response = await api.get('/geocoding/google', { params: { query }, signal });
    const data = response.data?.data ?? [];
    return (Array.isArray(data) ? data : []).map((r: any) => ({
      placeName: r.placeName,
      lat: r.lat,
      lng: r.lng,
    }));
  } catch (error: any) {
    if (error?.name === 'AbortError') throw error;
    return [];
  }
};

export const useAddressSearch = (query: string) => {
  const coordinates = useBranchStore((s) => s.branch?.coordinates);
  const [results, setResults] = useState<AddressResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Activamos la búsqueda a partir del cuarto carácter
    if (!query || query.trim().length < 4) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchAddresses = async () => {
      setLoading(true);
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) throw new Error('Falta el token de Mapbox');

        if (!coordinates) throw new Error('Sucursal sin coordenadas');
        const storeLng = coordinates.lng;
        const storeLat = coordinates.lat;

        // Usamos Geocoding v6 (la recomendada para calles y alturas estables)
        const url = new URL('https://api.mapbox.com/search/geocode/v6/forward');
        
        // Si el último token es un número (altura), lo cerramos con un espacio:
        // Mapbox autocompleta el último token como prefijo, y un número a medio
        // escribir nunca matchea una altura real hasta que se marca como "completo".
        const trimmedQuery = query.trim();
        const lastToken = trimmedQuery.split(/\s+/).pop() || '';
        const finalQuery = /^\d+$/.test(lastToken) ? `${trimmedQuery} ` : trimmedQuery;

        url.searchParams.append('q', finalQuery);
        url.searchParams.append('access_token', token);
        url.searchParams.append('country', 'ar');
        url.searchParams.append('language', 'es');
        
        // 🎯 FILTROS: Direcciones exactas y lugares (para mayor cobertura)
        url.searchParams.append('types', 'address,place');
        
        url.searchParams.append('bbox', `${storeLng - 0.1},${storeLat - 0.1},${storeLng + 0.1},${storeLat + 0.1}`);
        url.searchParams.append('proximity', `${storeLng},${storeLat}`);
        url.searchParams.append('limit', '5');
        url.searchParams.append('autocomplete', 'true');

        const response = await fetch(url.toString(), { signal });
        const data = await response.json();

        let mappedResults: AddressResult[] = [];
        if (data.features) {
          mappedResults = data.features.map((feature: any) => {
            const props = feature.properties;
            // Estructuramos el texto limpio: "Calle Altura, Ciudad, Provincia"
            const placeText = props.full_address 
              ? props.full_address 
              : `${props.name}${props.place_formatted ? ', ' + props.place_formatted : ''}`;

            return {
              placeName: placeText,
              lng: feature.geometry.coordinates[0],
              lat: feature.geometry.coordinates[1],
            };
          });
        }

        // 🛟 Fallback Google: solo si Mapbox no encontró nada Y la consulta
        // tiene altura (número al final), para no gastar cuota en nombres sueltos.
        if (mappedResults.length === 0 && /^\d+$/.test(lastToken)) {
          mappedResults = await fetchGoogleGeocode(trimmedQuery, signal);
        }

        setResults(mappedResults);
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        console.error('Error fetching addresses:', error);
        setResults([]);
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    // Debounce de 300ms para cuidar las peticiones
    const timeoutId = setTimeout(() => {
      fetchAddresses();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query, coordinates?.lat, coordinates?.lng]);

  return { results, loading };
};
