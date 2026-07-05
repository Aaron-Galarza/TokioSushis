'use client';
import { useState, useCallback } from 'react';
import {
  fetchConfigStatus, fetchDeliveryConfig,
  toggleEmergency as apiToggleEmergency, saveSchedule as apiSaveSchedule,
  saveBanner as apiSaveBanner, patchRain,
  addKmRange as apiAddKmRange, deleteKmRange as apiDeleteKmRange,
} from '@/services/admin.service';

interface KmRange { _id: string; maxKm: number; price: number }
export interface DaySch { day: string; openTime: string; closeTime: string; isStoreOpen: boolean }

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DEFAULT_SCHEDULE: DaySch[] = DAYS.map(day => ({ day, openTime: '12:00', closeTime: '23:00', isStoreOpen: true }));

function normDay(s: string | undefined | null): string {
  if (!s) return '';
  return s.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

const DAY_INDEX: Record<string, number> = {
  lunes: 0, monday: 0, martes: 1, tuesday: 1,
  miercoles: 2, wednesday: 2, jueves: 3, thursday: 3,
  viernes: 4, friday: 4, sabado: 5, saturday: 5,
  domingo: 6, sunday: 6,
};

export function useAdminConfig() {
  const [emergency, setEmergency]     = useState(false);
  const [schedule, setSchedule]       = useState<DaySch[]>(DEFAULT_SCHEDULE);
  const [schedSaved, setSchedSaved]   = useState(false);
  const [banner, setBanner]           = useState('');
  const [bannerSaved, setBannerSaved] = useState(false);
  const [isRaining, setIsRaining]     = useState(false);
  const [extraRain, setExtraRain]     = useState(0);
  const [ranges, setRanges]           = useState<KmRange[]>([]);
  const [nRange, setNRange]           = useState({ maxKm: '', price: '' });
  const [rErr, setRErr]               = useState('');

  const reload = useCallback(async () => {
    try {
      const [c, d] = await Promise.all([fetchConfigStatus(), fetchDeliveryConfig()]);
      setEmergency(c.isEmergencyClosed ?? false);
      setBanner(c.banner ?? '');
      const dbSchedule: any[] = c.dailySchedule ?? c.schedule ?? [];
      if (dbSchedule.length > 0) {
        setSchedule(DAYS.map((day, i) => {
          const match = dbSchedule.find((s: any) => DAY_INDEX[normDay(s?.day)] === i);
          return { day, openTime: match?.openTime ?? '12:00', closeTime: match?.closeTime ?? '23:00', isStoreOpen: match?.isStoreOpen ?? true };
        }));
      }
      setIsRaining(d.isRaining ?? false);
      setExtraRain(d.extraRain ?? 0);
      setRanges(d.kmRanges ?? []);
    } catch (err) {
      console.error('useAdminConfig reload:', err);
    }
  }, []);

  const toggleEmergency = async () => {
    try { await apiToggleEmergency(); await reload(); }
    catch (err) { console.error('toggleEmergency:', err); }
  };

  const saveSchedule = async () => {
    try { await apiSaveSchedule(schedule); setSchedSaved(true); setTimeout(() => setSchedSaved(false), 2500); await reload(); }
    catch (err) { console.error('saveSchedule:', err); }
  };

  const saveBanner = async () => {
    try { await apiSaveBanner(banner); setBannerSaved(true); setTimeout(() => setBannerSaved(false), 2500); await reload(); }
    catch (err) { console.error('saveBanner:', err); }
  };

  const toggleRain = async () => {
    try {
      const next = !isRaining;
      const cleanExtraRain = isNaN(extraRain) || extraRain < 0 ? 0 : Number(extraRain);
      await patchRain(next, cleanExtraRain);
      setIsRaining(next);
    } catch (err) { console.error('toggleRain:', err); }
  };

  const addRange = async () => {
    const maxKm = parseFloat(nRange.maxKm), price = parseFloat(nRange.price);
    if (!maxKm || maxKm <= 0 || isNaN(price) || price < 0) { setRErr('Ingresá km > 0 y precio >= 0'); return; }
    setRanges(await apiAddKmRange(maxKm, price));
    setNRange({ maxKm: '', price: '' }); setRErr('');
  };

  const deleteRange = async (id: string) => { setRanges(await apiDeleteKmRange(id)); };

  return {
    emergency, toggleEmergency,
    schedule, setSchedule, schedSaved, saveSchedule,
    banner, setBanner, bannerSaved, setBannerSaved, saveBanner,
    isRaining, extraRain, setExtraRain, toggleRain,
    ranges, nRange, setNRange, rErr, addRange, deleteRange,
    reload,
  };
}