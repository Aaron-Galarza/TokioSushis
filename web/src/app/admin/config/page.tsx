'use client';

import { useState, useEffect, useRef } from 'react';
import { AlertCircle, Power, Clock, Upload, Copy, Check, X, Loader2 } from 'lucide-react';
import api from '@/services/api';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

interface DaySchedule {
  day: string;
  openTime: string;
  closeTime: string;
  isStoreOpen: boolean;
}

interface GalleryImage {
  _id: string;
  url: string;
  filename: string;
}

export default function ConfigPage() {
  const [emergencyClosed, setEmergencyClosed] = useState(false);
  const [pricePerKm, setPricePerKm] = useState('0');
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    DAYS.map(day => ({ day, openTime: '12:00', closeTime: '23:00', isStoreOpen: true }))
  );
  const [configLoading, setConfigLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/config/status');
        const d = res.data.data;
        setEmergencyClosed(d.isEmergencyClosed ?? false);
        setPricePerKm(String(d.pricePerKm ?? 0));
      } finally {
        setConfigLoading(false);
      }
    };
    load();
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const res = await api.get('/gallery');
      setImages(res.data.data || []);
    } catch { /* gallery may not exist */ }
  };

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(''), 3000);
  };

  const toggleEmergency = async () => {
    const res = await api.put('/config/status');
    setEmergencyClosed(res.data.data.isEmergencyClosed);
  };

  const savePricePerKm = async () => {
    await api.put('/config/delivery', { pricePerKm: Number(pricePerKm) });
    flash('Precio por km guardado.');
  };

  const saveSchedule = async () => {
    const res = await api.put('/config/schedule', { schedule });
    const saved: DaySchedule[] = res.data.data.dailySchedule ?? [];
    if (saved.length) setSchedule(saved);
    flash('Horarios guardados.');
  };

  const updateDay = (i: number, field: keyof DaySchedule, value: string | boolean) => {
    setSchedule(prev => prev.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      await api.post('/gallery', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await fetchGallery();
    } catch { /* silent */ } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const deleteImage = async (id: string) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    await api.delete(`/gallery/${id}`);
    setImages(prev => prev.filter(img => img._id !== id));
  };

  const copyUrl = async (id: string, url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-5">

      {/* Left: Business Config */}
      <div className="flex flex-col gap-4">
        <div className="bg-[#161616] border border-white/10 rounded-2xl p-5">
          <h2 className="font-semibold text-white text-sm mb-4">Configuración del Negocio</h2>

          {msg && (
            <p className="text-green-400 text-xs bg-green-400/10 border border-green-400/20 px-3 py-2 rounded-lg mb-4">
              {msg}
            </p>
          )}

          {/* Panic button */}
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4 mb-4">
            <h3 className="font-semibold text-white text-sm mb-1">
              Estado del Local (Botón de Pánico)
            </h3>
            <div className="flex items-start gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-primary/70 shrink-0 mt-0.5" />
              <p className="text-white/40 text-xs leading-relaxed">
                Esta acción ignora los horarios normales y pausa la recepción de pedidos
              </p>
            </div>
            <button
              onClick={toggleEmergency}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${
                emergencyClosed
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              <Power className="w-4 h-4" />
              {emergencyClosed ? 'Reabrir Local' : 'Cerrar Local'}
            </button>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className={`w-2 h-2 rounded-full ${emergencyClosed ? 'bg-red-500' : 'bg-green-500'}`} />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                {emergencyClosed ? 'LOCAL CERRADO' : 'OPERANDO NORMALMENTE'}
              </span>
            </div>
          </div>

          {/* Price per km */}
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4 mb-4">
            <h3 className="font-semibold text-white text-sm mb-3">Precio por kilómetro</h3>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                value={pricePerKm}
                onChange={e => setPricePerKm(e.target.value)}
                className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-primary/50"
              />
              <button
                onClick={savePricePerKm}
                className="bg-primary text-black font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-primary/90 active:scale-95 transition-all"
              >
                Guardar
              </button>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-white text-sm">Horarios de Atención</h3>
            </div>
            <div className="flex flex-col gap-3">
              {schedule.map((day, i) => (
                <div key={day.day} className="flex items-center gap-3">
                  <span className="text-white/60 text-sm w-20 shrink-0">{day.day}</span>
                  <input
                    type="time"
                    value={day.openTime}
                    onChange={e => updateDay(i, 'openTime', e.target.value)}
                    className="bg-[#0A0A0A] border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-primary/50 w-24"
                  />
                  <span className="text-white/25 text-xs">-</span>
                  <input
                    type="time"
                    value={day.closeTime}
                    onChange={e => updateDay(i, 'closeTime', e.target.value)}
                    className="bg-[#0A0A0A] border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-primary/50 w-24"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-white/40 cursor-pointer ml-auto">
                    <input
                      type="checkbox"
                      checked={!day.isStoreOpen}
                      onChange={e => updateDay(i, 'isStoreOpen', !e.target.checked)}
                      className="accent-primary"
                    />
                    Cerrado
                  </label>
                </div>
              ))}
            </div>
            <button
              onClick={saveSchedule}
              className="mt-4 w-full bg-primary text-black font-bold py-2.5 rounded-xl text-sm hover:bg-primary/90 active:scale-[0.98] transition-all"
            >
              Guardar Horarios
            </button>
          </div>
        </div>
      </div>

      {/* Right: Image Gallery */}
      <div className="bg-[#161616] border border-white/10 rounded-2xl p-5">
        <h2 className="font-semibold text-white text-sm mb-4">Gestor de Imágenes en la Nube</h2>

        {/* Upload zone */}
        <div
          onClick={() => fileRef.current?.click()}
          className="border border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all mb-4"
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleUpload}
          />
          {uploading ? (
            <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin mb-3" />
          ) : (
            <Upload className="w-8 h-8 text-white/20 mx-auto mb-3" />
          )}
          <p className="text-white/60 text-sm font-medium">
            {uploading ? 'Subiendo...' : 'Arrastra o sube tus imágenes aquí'}
          </p>
          <p className="text-white/25 text-xs mt-1">JPG, PNG o WEBP (Max. 5MB)</p>
          {!uploading && (
            <button
              type="button"
              className="mt-4 border border-primary/40 text-primary px-4 py-2 rounded-lg text-xs font-semibold hover:bg-primary/10 transition-colors"
            >
              Seleccionar archivos
            </button>
          )}
        </div>

        {/* Image grid */}
        {images.length === 0 ? (
          <p className="text-white/20 text-xs text-center py-4">Sin imágenes cargadas.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {images.map(img => (
              <div key={img._id} className="group relative rounded-xl overflow-hidden aspect-square bg-zinc-900 border border-white/10">
                <img
                  src={img.url}
                  alt={img.filename}
                  className="w-full h-full object-cover"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
                  <button
                    onClick={() => copyUrl(img._id, img.url)}
                    className="flex items-center gap-1.5 bg-primary text-black text-[10px] font-bold px-2.5 py-1.5 rounded-lg"
                  >
                    {copiedId === img._id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedId === img._id ? 'Copiado' : 'Copiar Link'}
                  </button>
                  <button
                    onClick={() => deleteImage(img._id)}
                    className="flex items-center gap-1 bg-red-600/80 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg"
                  >
                    <X className="w-3 h-3" />
                    Eliminar
                  </button>
                </div>
                <p className="absolute bottom-0 inset-x-0 bg-black/60 text-white/50 text-[9px] px-1.5 py-1 truncate">
                  {img.filename}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
