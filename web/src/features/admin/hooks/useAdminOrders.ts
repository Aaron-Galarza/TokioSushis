'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchAdminOrders, updateOrderStatus as apiUpdateStatus } from '@/services/admin.service';

export type SF = 'pending' | 'in-preparation' | 'completed' | 'cancelled';

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

  const oCounts = useMemo(() => ({
    pending:          orders.filter(o => o.status === 'pending').length,
    'in-preparation': orders.filter(o => o.status === 'in-preparation').length,
    completed:        orders.filter(o => o.status === 'ready' || o.status === 'delivered').length,
    cancelled:        orders.filter(o => o.status === 'cancelled').length,
  }), [orders]);

  const filteredOrders = useMemo(() => orders.filter(o => {
    if (sFilter === 'completed') return o.status === 'ready' || o.status === 'delivered';
    return o.status === sFilter;
  }), [orders, sFilter]);

  const updateStatus = useCallback(async (id: string, status: string) => {
    await apiUpdateStatus(id, status);
    reload();
  }, [reload]);

  return { orders, sFilter, setSFilter, expandedId, setExpandedId, oCounts, filteredOrders, updateStatus, reload };
}
