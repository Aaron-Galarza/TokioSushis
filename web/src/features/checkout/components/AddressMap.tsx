'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css'; 
import { useCartStore } from '@/stores/cart.store';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export const AddressMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  
  const { deliveryCoordinates, deliveryType } = useCartStore();

  useEffect(() => {
    if (deliveryType === 'pickup' || !deliveryCoordinates || !mapContainer.current) return;

    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11', 
        center: [deliveryCoordinates.lng, deliveryCoordinates.lat],
        zoom: 15.5,
        interactive: false, 
        attributionControl: false,
      });

      // 👇 EL ANTÍDOTO PARA EL BUG DE TAILWIND:
      // Apenas el mapa termine de inicializarse internamente, le obligamos a recalcular su tamaño real
      map.current.on('load', () => {
        map.current?.resize();
      });

      const customMarker = document.createElement('div');
      customMarker.className = 'w-5 h-5 bg-primary rounded-full shadow-[0_0_20px_rgba(249,239,188,0.8)] border-[3px] border-black';

      marker.current = new mapboxgl.Marker(customMarker)
        .setLngLat([deliveryCoordinates.lng, deliveryCoordinates.lat])
        .addTo(map.current);
        
    } else {
      map.current.flyTo({
        center: [deliveryCoordinates.lng, deliveryCoordinates.lat],
        zoom: 15.5,
        speed: 1.2
      });
      marker.current?.setLngLat([deliveryCoordinates.lng, deliveryCoordinates.lat]);
      
      // Por las dudas, forzamos un resize en cada actualización de coordenadas
      map.current.resize();
    }
  }, [deliveryCoordinates, deliveryType]);

  if (deliveryType === 'pickup' || !deliveryCoordinates) {
    return null;
  }

  return (
    <div className="w-full h-[220px] rounded-2xl overflow-hidden border border-white/10 mt-4 shadow-lg animate-in fade-in zoom-in-95 duration-500">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};