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

        const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
        
        url.searchParams.append('access_token', token);
        url.searchParams.append('country', 'ar');
        url.searchParams.append('types', 'address');
        url.searchParams.append('limit', '5');
        url.searchParams.append('proximity', `${storeLng},${storeLat}`);
        url.searchParams.append('language', 'es');
        url.searchParams.append('autocomplete', 'true');

        const response = await fetch(url.toString(), { signal });
        const data = await response.json();

        if (data.features) {
          const mappedResults: AddressResult[] = data.features.map((feature: any) => ({
            placeName: feature.place_name,
            lng: feature.center[0],
            lat: feature.center[1],
          }));
          
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