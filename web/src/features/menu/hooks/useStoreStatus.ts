import { useState, useEffect } from 'react';
import { menuService } from '@/services/menu.service';

export const useStoreStatus = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('');
  const [banner, setBanner] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      try {
        setLoading(true);
        const statusData = await menuService.getStoreStatus();

        if (isMounted) {
          setIsOpen(statusData.isOpen);
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
    };

    fetchStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    isOpen,
    message,
    banner,
    loading,
    error,
  };
};