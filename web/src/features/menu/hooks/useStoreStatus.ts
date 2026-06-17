import { useState, useEffect } from 'react';
import { menuService } from '@/services/menu.service';
import { useCartStore } from '@/stores/cart.store';

export const useStoreStatus = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('');
  const [pricePerKm, setPricePerKm] = useState<number>(0);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Extraemos la acción del store (asumimos que la llamaste setPricePerKm o similar)
  const setStorePricePerKm = useCartStore((state) => state.setPricePerKm);

  useEffect(() => {
    let isMounted = true; // Para evitar actualizaciones de estado si el componente se desmonta

    const fetchStatus = async () => {
      try {
        setLoading(true);
        // Hacemos el fetch al montar
        const statusData = await menuService.getStoreStatus();
        
        if (isMounted) {
          setIsOpen(statusData.isOpen);
          setMessage(statusData.message || '');
          setPricePerKm(statusData.pricePerKm || 0);
          
          // Disparamos la acción de Zustand para guardar el valor para el Bloque 3
          if (statusData.pricePerKm !== undefined && setStorePricePerKm) {
            setStorePricePerKm(statusData.pricePerKm);
          }
          
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error obteniendo el estado del local:', err);
          setError('No pudimos verificar si el local está abierto.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStatus();

    return () => {
      isMounted = false;
    };
  }, [setStorePricePerKm]);

  return { 
    isOpen, 
    message, 
    pricePerKm, 
    loading, 
    error 
  };
};