import { useState, useEffect, useCallback } from 'react';
import { menuService } from '@/services/menu.service';

export const useStoreStatus = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('');
  const [banner, setBanner] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async (isMounted = true) => {
    try {
      setLoading(true);
      // Como el servicio ya viene tipado y desempaquetado, lo leemos directo
      const statusData = await menuService.getStoreStatus();

      if (isMounted && statusData) {
        setIsOpen(statusData.isOpen ?? true);
        setMessage(statusData.message || '');
        setBanner(statusData.banner || '');
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
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchStatus(isMounted);

    return () => {
      isMounted = false;
    };
  }, [fetchStatus]);

  return {
    isOpen,
    message,
    banner,
    loading,
    error,
    refreshStatus: () => fetchStatus(true),
  };
};