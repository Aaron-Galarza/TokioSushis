'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchAdminOrders, updateOrderStatus as apiUpdateStatus } from '@/services/admin.service';

// 🔥 Sumamos 'delivered' a los filtros válidos del Frontend
export type SF = 'pending' | 'in-preparation' | 'completed' | 'delivered' | 'cancelled';

export function useAdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [sFilter, setSFilter] = useState<SF>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reload = useCallback(async () => {
    try { setOrders(await fetchAdminOrders()); } catch {}
  }, []);

  useEffect(() => {
    reload();
    pollRef.current = setInterval(reload, 15000);
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [reload]);

  // 📊 Contadores limpios 1:1 mapeados con la DB
  const oCounts = useMemo(() => ({
    pending:          orders.filter(o => o.status === 'pending').length,
    'in-preparation': orders.filter(o => o.status === 'in-preparation').length,
    completed:        orders.filter(o => o.status === 'ready').length, // 📦 Solo listos/terminados
    delivered:        orders.filter(o => o.status === 'delivered').length, // 🏁 Entregados
    cancelled:        orders.filter(o => o.status === 'cancelled').length,
  }), [orders]);

  // 🎯 Filtro estricto sin mezclas raras
  const filteredOrders = useMemo(() => orders.filter(o => {
    if (sFilter === 'completed') return o.status === 'ready';
    return o.status === sFilter;
  }), [orders, sFilter]);

  const updateStatus = useCallback(async (id: string, status: string) => {
    await apiUpdateStatus(id, status);
    reload();
  }, [reload]);

  return { orders, sFilter, setSFilter, expandedId, setExpandedId, oCounts, filteredOrders, updateStatus, reload };
}