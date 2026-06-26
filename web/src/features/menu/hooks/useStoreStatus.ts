'use client';

import { useState, useEffect, useCallback } from 'react';
import { menuService } from '@/services/menu.service';

export const useStoreStatus = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('');
  const [banner, setBanner] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const statusData = await menuService.getStoreStatus();
      if (statusData) {
        setIsOpen(statusData.isOpen ?? true);
        setMessage(statusData.message || '');
        setBanner(statusData.banner || '');
        setError(null);
      }
    } catch (err) {
      console.error('Error obteniendo el estado del local:', err);
      // Igual que en useMenu: un fallo en segundo plano no debe romper la vista
      if (showLoader) setError('No pudimos verificar si el local está abierto.');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus(true);

    // El estado abierto/cerrado es información viva: al volver a la pestaña
    // lo refrescamos siempre (es liviano y conviene tenerlo al día).
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchStatus(false);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchStatus]);

  return {
    isOpen, message, banner, loading, error,
    refreshStatus: () => fetchStatus(false),
  };
};