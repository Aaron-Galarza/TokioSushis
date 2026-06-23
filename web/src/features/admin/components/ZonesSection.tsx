import { MapPin, Plus, Trash2 } from 'lucide-react';
import { AdminCard } from './ui/AdminCard';
import { AdminInput } from './ui/AdminInput';

interface Zone { _id: string; name: string; radiusMeters: number; lat: number; lng: number; price: number; }
interface NZone { name: string; lat: string; lng: string; radiusMeters: string; price: string; }

interface Props {
  zones: Zone[];
  showZoneForm: boolean;
  setShowZoneForm: (updater: (prev: boolean) => boolean) => void;
  nZone: NZone;
  setNZone: (updater: (prev: NZone) => NZone) => void;
  zErr: string;
  addZone: () => void;
  deleteZone: (id: string) => void;
}

export function ZonesSection({ zones, showZoneForm, setShowZoneForm, nZone, setNZone, zErr, addZone, deleteZone }: Props) {
  return (
    <AdminCard>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-white text-sm">Zonas Especiales</h2>
        </div>
        <button onClick={() => setShowZoneForm(p => !p)} className="flex items-center gap-1.5 text-primary border border-primary/30 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">
          <Plus className="w-3.5 h-3.5" />Nueva zona
        </button>
      </div>
      <div className="flex flex-col gap-2 mb-3 max-h-52 overflow-y-auto overscroll-contain scrollbar-none">
        {zones.length === 0 && <p className="text-white/25 text-xs text-center py-3">Sin zonas especiales</p>}
        {zones.map(z => (
          <div key={z._id} className="bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 flex items-start justify-between">
            <div>
              <p className="text-white text-sm">{z.name}</p>
              <p className="text-white/30 text-xs">Radio: {z.radiusMeters}m · {z.lat.toFixed(4)}, {z.lng.toFixed(4)}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-4">
              <span className="text-primary text-sm">${z.price.toLocaleString('es-AR')}</span>
              <button onClick={() => deleteZone(z._id)} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
      {showZoneForm && (
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <p className="text-white/60 text-xs mb-3">Nueva zona especial</p>
          <div className="flex flex-col gap-2">
            <AdminInput placeholder="Nombre" value={nZone.name} onChange={e => setNZone(p => ({ ...p, name: e.target.value }))} className="py-2" />
            <div className="grid grid-cols-2 gap-2">
              <AdminInput type="number" step="any" placeholder="Latitud" value={nZone.lat} onChange={e => setNZone(p => ({ ...p, lat: e.target.value }))} className="py-2" />
              <AdminInput type="number" step="any" placeholder="Longitud" value={nZone.lng} onChange={e => setNZone(p => ({ ...p, lng: e.target.value }))} className="py-2" />
              <AdminInput type="number" placeholder="Radio (m)" value={nZone.radiusMeters} onChange={e => setNZone(p => ({ ...p, radiusMeters: e.target.value }))} className="py-2" />
              <AdminInput type="number" placeholder="Precio ($)" value={nZone.price} onChange={e => setNZone(p => ({ ...p, price: e.target.value }))} className="py-2" />
            </div>
            {zErr && <p className="text-red-400 text-xs">{zErr}</p>}
            <div className="flex gap-2">
              <button onClick={addZone} className="flex items-center gap-1.5 text-primary border border-primary/30 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">
                <Plus className="w-3.5 h-3.5" />Agregar
              </button>
              <button onClick={() => setShowZoneForm(() => false)} className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white text-xs transition-all">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </AdminCard>
  );
}
