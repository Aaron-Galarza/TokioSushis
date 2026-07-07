'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { X } from 'lucide-react';

interface MapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCoordinates: (lat: number, lng: number, placeName: string) => void;
  initialLat?: number;
  initialLng?: number;
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export const MapPicker = ({
  isOpen,
  onClose,
  onSelectCoordinates,
  initialLat = -27.4559739,
  initialLng = -59.0020127,
}: MapPickerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!isOpen || !mapContainer.current) return;

    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [initialLng, initialLat],
        zoom: 14,
        attributionControl: false,
      });

      map.current.on('load', () => {
        map.current?.resize();
      });

      // Marcador inicial
      const initialMarker = document.createElement('div');
      initialMarker.className = 'w-5 h-5 bg-primary rounded-full shadow-[0_0_20px_rgba(197,168,111,0.6)] border-[3px] border-black cursor-pointer';

      marker.current = new mapboxgl.Marker(initialMarker)
        .setLngLat([initialLng, initialLat])
        .addTo(map.current);

      setSelectedCoords({ lat: initialLat, lng: initialLng });

      // Click en el mapa para mover marcador
      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        marker.current?.setLngLat([lng, lat]);
        setSelectedCoords({ lat, lng });
      });
    } else {
      map.current.resize();
      if (mapContainer.current && mapContainer.current.offsetParent !== null) {
        map.current.easeTo({ center: [initialLng, initialLat], zoom: 14 });
      }
    }

    return () => {
      // No destruir el mapa, solo dejarlo listo
    };
  }, [isOpen, initialLat, initialLng]);

  const handleConfirm = async () => {
    if (!selectedCoords) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${selectedCoords.lng},${selectedCoords.lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
      );
      const data = await response.json();
      const placeName = data.features?.[0]?.place_name || `${selectedCoords.lat.toFixed(4)}, ${selectedCoords.lng.toFixed(4)}`;

      onSelectCoordinates(selectedCoords.lat, selectedCoords.lng, placeName);
      onClose();
    } catch (error) {
      console.error('Error al obtener nombre del lugar:', error);
      onSelectCoordinates(selectedCoords.lat, selectedCoords.lng, `${selectedCoords.lat.toFixed(4)}, ${selectedCoords.lng.toFixed(4)}`);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col border border-white/10">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Seleccioná tu dirección en el mapa</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white/90 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 relative">
          <div ref={mapContainer} className="w-full h-full rounded-lg" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-white/70 text-sm">
              Hacé click en el mapa para marcar tu dirección
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-white/10 bg-zinc-800/50">
          {selectedCoords && (
            <div className="flex-1 text-xs text-white/60">
              Coordenadas: {selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}
            </div>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-white/20 text-white/80 hover:bg-white/5 transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedCoords}
            className="px-4 py-2 rounded-lg bg-primary text-black hover:bg-primary/90 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};
