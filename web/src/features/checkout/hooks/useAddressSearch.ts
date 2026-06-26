'use client';

import { useState, useEffect } from 'react';

export interface AddressResult {
  placeName: string;
  lat: number;
  lng: number;
}

export const useAddressSearch = (query: string) => {
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

        const storeLng = Number(process.env.NEXT_PUBLIC_STORE_LNG) || -58.9630312;
        const storeLat = Number(process.env.NEXT_PUBLIC_STORE_LAT) || -27.4379852;

        // Usamos Geocoding v6 (la recomendada para calles y alturas estables)
        const url = new URL('https://api.mapbox.com/search/geocode/v6/forward');
        
        url.searchParams.append('q', query);
        url.searchParams.append('access_token', token);
        url.searchParams.append('country', 'ar');
        url.searchParams.append('language', 'es');
        
        // 🎯 FILTRO EXCLUSIVO: Solo calles con numeración exacta
        url.searchParams.append('types', 'address');
        
        // 🗺️ LÍMITE GEOGRÁFICO: Encuadra estrictamente el Gran Resistencia (Fontana, Barranqueras, Vilelas)
        url.searchParams.append('bbox', '-59.0526,-27.4915,-58.8953,-27.4022');
        url.searchParams.append('proximity', `${storeLng},${storeLat}`);
        url.searchParams.append('limit', '5');
        url.searchParams.append('autocomplete', 'true');

        const response = await fetch(url.toString(), { signal });
        const data = await response.json();

        if (data.features) {
          const mappedResults: AddressResult[] = data.features.map((feature: any) => {
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
          
          setResults(mappedResults);
        }
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
  }, [query]);

  return { results, loading };
};