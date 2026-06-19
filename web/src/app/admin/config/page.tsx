'use client';

import { useState, useEffect } from 'react';
import {
  AlertCircle, Power, Clock, CheckCircle,
  CloudRain, Sun, Plus, Trash2, MapPin, Route, Truck, Loader2, ImageIcon,
} from 'lucide-react';
import api from '@/services/api';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

interface DaySchedule {
  day: string;
  openTime: string;
  closeTime: string;
  isStoreOpen: boolean;
}

interface KmRange {
  _id: string;
  maxKm: number;
  price: number;
}

interface SpecialZone {
  _id: string;
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  price: number;
}

const inputCls =
  'bg-[#0A0A0A] text-white px-3 py-2.5 rounded-lg border border-[#2A2A2A] focus:outline-none focus:border-primary text-sm w-full placeholder:text-muted-foreground';

export default function ConfigPage() {
  const [loading, setLoading] = useState(true);

  // ── Store state ──────────────────────────────────────────────
  const [emergencyClosed, setEmergencyClosed] = useState(false);
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    DAYS.map((day) => ({ day, openTime: '20:00', closeTime: '23:00', isStoreOpen: true }))
  );
  const [schedulesSaved, setSchedulesSaved] = useState(false);
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerInput, setBannerInput] = useState('');
  const [bannerSaved, setBannerSaved] = useState(false);

  // ── Delivery state ───────────────────────────────────────────
  const [isRaining, setIsRaining] = useState(false);
  const [extraRain, setExtraRain] = useState(0);
  const [rainSaved, setRainSaved] = useState(false);
  const [ranges, setRanges] = useState<KmRange[]>([]);
  const [zones, setZones] = useState<SpecialZone[]>([]);
  const [pricePerKm, setPricePerKm] = useState('0');
  const [priceSaved, setPriceSaved] = useState(false);

  // ── Range form ───────────────────────────────────────────────
  const [newRange, setNewRange] = useState({ maxKm: '', price: '' });
  const [rangeError, setRangeError] = useState('');

  // ── Zone form ────────────────────────────────────────────────
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [newZone, setNewZone] = useState({ name: '', lat: '', lng: '', radiusMeters: '', price: '' });
  const [zoneError, setZoneError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [configRes, deliveryRes] = await Promise.all([
          api.get('/config/status'),
          api.get('/delivery/config'),
        ]);
        const c = configRes.data.data;
        setEmergencyClosed(c.isEmergencyClosed ?? false);
        setBannerUrl(c.banner ?? '');
        setBannerInput(c.banner ?? '');
        setPricePerKm(String(c.pricePerKm ?? 0));
        if (c.dailySchedule?.length) setSchedule(c.dailySchedule);

        const d = deliveryRes.data.data;
        setIsRaining(d.isRaining ?? false);
        setExtraRain(d.extraRain ?? 0);
        setRanges(d.kmRanges ?? []);
        setZones(d.specialZones ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Store actions ────────────────────────────────────────────
  const toggleEmergency = async () => {
    const res = await api.put('/config/status');
    setEmergencyClosed(res.data.data.isEmergencyClosed);
  };

  const saveSchedule = async () => {
    await api.put('/config/schedule', { schedule });
    setSchedulesSaved(true);
    setTimeout(() => setSchedulesSaved(false), 2500);
  };

  const saveBanner = async () => {
    await api.put('/config/banner', { banner: bannerInput });
    setBannerUrl(bannerInput);
    setBannerSaved(true);
    setTimeout(() => setBannerSaved(false), 2500);
  };

  // ── Delivery actions ─────────────────────────────────────────
  const toggleRain = async () => {
    const next = !isRaining;
    await api.patch('/delivery/config/rain', { isRaining: next, extraRain });
    setIsRaining(next);
    setRainSaved(true);
    setTimeout(() => setRainSaved(false), 2000);
  };

  const addRange = async () => {
    const maxKm = parseFloat(newRange.maxKm);
    const price = parseFloat(newRange.price);
    if (!maxKm || maxKm <= 0 || isNaN(price) || price < 0) {
      setRangeError('Ingresá km > 0 y precio >= 0');
      return;
    }
    const res = await api.post('/delivery/config/ranges', { maxKm, price });
    setRanges(res.data.data.data);
    setNewRange({ maxKm: '', price: '' });
    setRangeError('');
  };

  const deleteRange = async (id: string) => {
    const res = await api.delete(`/delivery/config/ranges/${id}`);
    setRanges(res.data.data.data);
  };

  const addZone = async () => {
    const lat = parseFloat(newZone.lat);
    const lng = parseFloat(newZone.lng);
    const r = parseFloat(newZone.radiusMeters);
    const price = parseFloat(newZone.price);
    if (!newZone.name || isNaN(lat) || isNaN(lng) || !r || r <= 0 || isNaN(price) || price < 0) {
      setZoneError('Completá todos los campos correctamente');
      return;
    }
    const res = await api.post('/delivery/config/zones', {
      name: newZone.name, lat, lng, radiusMeters: r, price,
    });
    setZones(res.data.data.data);
    setNewZone({ name: '', lat: '', lng: '', radiusMeters: '', price: '' });
    setZoneError('');
    setShowZoneForm(false);
  };

  const deleteZone = async (id: string) => {
    const res = await api.delete(`/delivery/config/zones/${id}`);
    setZones(res.data.data.data);
  };

  const savePricePerKm = async () => {
    await api.put('/config/delivery', { pricePerKm: Number(pricePerKm) });
    setPriceSaved(true);
    setTimeout(() => setPriceSaved(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-5">

      {/* ─── LEFT: Business Config ─────────────────────────── */}
      <div className="space-y-4">

        {/* Estado del Local */}
        <div className="bg-[#161616] rounded-xl p-6 border border-[#2A2A2A]">
          <h2 className="text-white text-xl mb-4">Estado del Local</h2>
          <div className="flex items-start gap-3 mb-4 bg-[#1A1A1A] rounded-lg p-3 border border-[#2A2A2A]">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-muted-foreground text-sm">
              El botón de pánico ignora los horarios normales y cierra la recepción de pedidos de forma inmediata.
            </p>
          </div>
          <button
            onClick={toggleEmergency}
            className={`w-full py-4 rounded-lg transition-all flex items-center justify-center gap-2 mb-3 font-semibold ${
              emergencyClosed
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            <Power className="w-5 h-5" />
            {emergencyClosed ? '🟢 Reabrir Local' : '🔴 Cerrar de Emergencia'}
          </button>
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${emergencyClosed ? 'bg-red-500' : 'bg-green-500'}`} />
            <span className="text-white text-sm">
              {emergencyClosed ? 'CIERRE DE EMERGENCIA ACTIVO' : 'OPERANDO NORMALMENTE'}
            </span>
          </div>
        </div>

        {/* Horarios */}
        <div className="bg-[#161616] rounded-xl p-6 border border-[#2A2A2A]">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-white text-xl">Horarios de Atención</h2>
          </div>
          <div className="space-y-2">
            {schedule.map((item, i) => (
              <div
                key={item.day}
                className={`flex items-center gap-3 rounded-lg p-3 border transition-colors ${
                  !item.isStoreOpen
                    ? 'bg-[#111] border-[#2A2A2A] opacity-60'
                    : 'bg-[#1A1A1A] border-[#2A2A2A]'
                }`}
              >
                <span className="text-white w-24 text-sm shrink-0">{item.day}</span>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="time"
                    value={item.openTime}
                    disabled={!item.isStoreOpen}
                    onChange={(e) =>
                      setSchedule((prev) =>
                        prev.map((d, idx) => (idx === i ? { ...d, openTime: e.target.value } : d))
                      )
                    }
                    className="bg-[#0A0A0A] text-white px-2 py-2 rounded-lg border border-[#2A2A2A] text-sm disabled:opacity-40 w-full focus:outline-none focus:border-primary"
                  />
                  <span className="text-muted-foreground shrink-0">–</span>
                  <input
                    type="time"
                    value={item.closeTime}
                    disabled={!item.isStoreOpen}
                    onChange={(e) =>
                      setSchedule((prev) =>
                        prev.map((d, idx) => (idx === i ? { ...d, closeTime: e.target.value } : d))
                      )
                    }
                    className="bg-[#0A0A0A] text-white px-2 py-2 rounded-lg border border-[#2A2A2A] text-sm disabled:opacity-40 w-full focus:outline-none focus:border-primary"
                  />
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={!item.isStoreOpen}
                    onChange={(e) =>
                      setSchedule((prev) =>
                        prev.map((d, idx) => (idx === i ? { ...d, isStoreOpen: !e.target.checked } : d))
                      )
                    }
                    className="w-4 h-4 accent-[#C5A86F]"
                  />
                  <span className="text-muted-foreground text-xs">Cerrado</span>
                </label>
              </div>
            ))}
          </div>
          <button
            onClick={saveSchedule}
            className="w-full mt-4 bg-primary hover:bg-primary/90 text-black py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-semibold"
          >
            {schedulesSaved ? <><CheckCircle className="w-4 h-4" /> Guardado</> : 'Guardar Horarios'}
          </button>
        </div>

        {/* Banner */}
        <div className="bg-[#161616] rounded-xl p-6 border border-[#2A2A2A]">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-primary" />
            <h2 className="text-white text-xl">Banner del Inicio</h2>
          </div>
          {bannerUrl && (
            <div className="rounded-xl overflow-hidden mb-4 border border-[#2A2A2A] aspect-video">
              <img src={bannerUrl} alt="Banner actual" className="w-full h-full object-cover" />
            </div>
          )}
          <label className="text-muted-foreground text-sm mb-2 block">URL de la nueva imagen</label>
          <input
            type="url"
            value={bannerInput}
            onChange={(e) => { setBannerInput(e.target.value); setBannerSaved(false); }}
            placeholder="https://..."
            className="w-full bg-[#1A1A1A] text-white px-4 py-3 rounded-lg border border-[#2A2A2A] focus:outline-none focus:border-primary mb-3 text-sm"
          />
          <button
            onClick={saveBanner}
            disabled={!bannerInput.trim()}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-black py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-semibold"
          >
            {bannerSaved ? <><CheckCircle className="w-4 h-4" /> Banner actualizado</> : 'Actualizar Banner'}
          </button>
        </div>
      </div>

      {/* ─── RIGHT: Delivery Config ─────────────────────────── */}
      <div className="space-y-4">

        {/* Modo Lluvia */}
        <div className="bg-[#161616] rounded-xl p-6 border border-[#2A2A2A]">
          <div className="flex items-center gap-2 mb-4">
            {isRaining
              ? <CloudRain className="w-5 h-5 text-blue-400" />
              : <Sun className="w-5 h-5 text-yellow-400" />}
            <h2 className="text-white text-xl">Modo Lluvia</h2>
            {rainSaved && <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />}
          </div>

          <div className="flex items-center justify-between bg-[#1A1A1A] rounded-lg p-4 border border-[#2A2A2A] mb-4">
            <div>
              <p className="text-white text-sm">Recargo por lluvia</p>
              <p className="text-muted-foreground text-xs">Se suma al costo base de envío</p>
            </div>
            <button
              onClick={toggleRain}
              className={`relative w-12 h-6 rounded-full transition-colors ${isRaining ? 'bg-blue-500' : 'bg-[#2A2A2A]'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isRaining ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div>
            <label className="text-muted-foreground text-sm mb-2 block">Recargo extra por lluvia ($)</label>
            <input
              type="number"
              value={extraRain}
              onChange={(e) => setExtraRain(Number(e.target.value))}
              min={0}
              className={inputCls}
            />
            {isRaining && (
              <p className="text-blue-400 text-xs mt-2">
                🌧 Modo lluvia activo — recargo de ${extraRain.toLocaleString('es-CL')} aplicado
              </p>
            )}
          </div>
        </div>

        {/* Rangos por KM */}
        <div className="bg-[#161616] rounded-xl p-6 border border-[#2A2A2A]">
          <div className="flex items-center gap-2 mb-4">
            <Route className="w-5 h-5 text-primary" />
            <h2 className="text-white text-xl">Rangos por Kilómetro</h2>
          </div>

          <div className="space-y-2 mb-4">
            {ranges.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">Sin rangos configurados</p>
            )}
            {ranges.map((r) => (
              <div key={r._id} className="flex items-center justify-between bg-[#1A1A1A] rounded-lg px-4 py-3 border border-[#2A2A2A]">
                <span className="text-white text-sm">
                  Hasta <span className="text-primary">{r.maxKm} km</span>
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-primary">${r.price.toLocaleString('es-CL')}</span>
                  <button
                    onClick={() => deleteRange(r._id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#2A2A2A] space-y-3">
            <p className="text-white text-sm">Agregar rango</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-muted-foreground text-xs mb-1 block">Máx. km</label>
                <input
                  type="number"
                  value={newRange.maxKm}
                  onChange={(e) => setNewRange((p) => ({ ...p, maxKm: e.target.value }))}
                  placeholder="ej: 8"
                  min={0}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-muted-foreground text-xs mb-1 block">Precio ($)</label>
                <input
                  type="number"
                  value={newRange.price}
                  onChange={(e) => setNewRange((p) => ({ ...p, price: e.target.value }))}
                  placeholder="ej: 3000"
                  min={0}
                  className={inputCls}
                />
              </div>
            </div>
            {rangeError && <p className="text-red-400 text-xs">{rangeError}</p>}
            <button
              onClick={addRange}
              className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-4 py-2 rounded-lg text-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Agregar rango
            </button>
          </div>
        </div>

        {/* Zonas Especiales */}
        <div className="bg-[#161616] rounded-xl p-6 border border-[#2A2A2A]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="text-white text-xl">Zonas Especiales</h2>
            </div>
            <button
              onClick={() => setShowZoneForm((p) => !p)}
              className="flex items-center gap-1.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-3 py-1.5 rounded-lg text-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Nueva zona
            </button>
          </div>

          <div className="space-y-2 mb-4">
            {zones.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">Sin zonas especiales</p>
            )}
            {zones.map((z) => (
              <div key={z._id} className="bg-[#1A1A1A] rounded-lg px-4 py-3 border border-[#2A2A2A]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white text-sm">{z.name}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      Radio: {z.radiusMeters} m · {z.lat.toFixed(4)}, {z.lng.toFixed(4)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-primary text-sm">${z.price.toLocaleString('es-CL')}</span>
                    <button
                      onClick={() => deleteZone(z._id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showZoneForm && (
            <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#2A2A2A] space-y-3">
              <p className="text-white text-sm">Nueva zona especial</p>
              <div>
                <label className="text-muted-foreground text-xs mb-1 block">Nombre</label>
                <input
                  value={newZone.name}
                  onChange={(e) => setNewZone((p) => ({ ...p, name: e.target.value }))}
                  placeholder="ej: Centro Histórico"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground text-xs mb-1 block">Latitud</label>
                  <input
                    type="number" step="any"
                    value={newZone.lat}
                    onChange={(e) => setNewZone((p) => ({ ...p, lat: e.target.value }))}
                    placeholder="-27.4514"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-muted-foreground text-xs mb-1 block">Longitud</label>
                  <input
                    type="number" step="any"
                    value={newZone.lng}
                    onChange={(e) => setNewZone((p) => ({ ...p, lng: e.target.value }))}
                    placeholder="-58.9867"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-muted-foreground text-xs mb-1 block">Radio (metros)</label>
                  <input
                    type="number"
                    value={newZone.radiusMeters}
                    onChange={(e) => setNewZone((p) => ({ ...p, radiusMeters: e.target.value }))}
                    placeholder="ej: 1000"
                    min={1}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-muted-foreground text-xs mb-1 block">Precio ($)</label>
                  <input
                    type="number"
                    value={newZone.price}
                    onChange={(e) => setNewZone((p) => ({ ...p, price: e.target.value }))}
                    placeholder="ej: 1500"
                    min={0}
                    className={inputCls}
                  />
                </div>
              </div>
              {zoneError && <p className="text-red-400 text-xs">{zoneError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={addZone}
                  className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-4 py-2 rounded-lg text-sm transition-all"
                >
                  <Plus className="w-4 h-4" /> Agregar zona
                </button>
                <button
                  onClick={() => { setShowZoneForm(false); setZoneError(''); }}
                  className="px-4 py-2 rounded-lg bg-[#2A2A2A] hover:bg-[#333] text-muted-foreground text-sm transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Precio Base por KM */}
        <div className="bg-[#161616] rounded-xl p-6 border border-[#2A2A2A]">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-5 h-5 text-primary" />
            <h2 className="text-white text-xl">Precio Base por KM</h2>
          </div>
          <div className="space-y-3">
            <label className="text-muted-foreground text-sm block">Precio por kilómetro ($)</label>
            <input
              type="number"
              value={pricePerKm}
              onChange={(e) => { setPricePerKm(e.target.value); setPriceSaved(false); }}
              min={0}
              className="bg-[#0A0A0A] text-white px-4 py-3 rounded-lg border border-[#2A2A2A] focus:outline-none focus:border-primary text-sm w-full"
            />
            <button
              onClick={savePricePerKm}
              className="w-full bg-primary hover:bg-primary/90 text-black py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-semibold"
            >
              {priceSaved ? <><CheckCircle className="w-4 h-4" /> Guardado</> : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
