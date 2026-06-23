'use client';

import { useState, useCallback } from 'react';
import { fetchAnalytics, type AdminRange } from '@/services/admin.service';

export function useAdminOverview() {
  const [aRange, setARange] = useState<AdminRange>('hoy');
  const [analytics, setAnalytics] = useState<any>(null);
  const [aLoading, setALoading] = useState(true);

  const reload = useCallback(async (range?: AdminRange) => {
    const r = range ?? aRange;
    setALoading(true);
    try { setAnalytics(await fetchAnalytics(r)); }
    finally { setALoading(false); }
  }, [aRange]);

  const changeRange = (r: AdminRange) => { setARange(r); reload(r); };

  return { aRange, changeRange, analytics, aLoading, reload };
}
