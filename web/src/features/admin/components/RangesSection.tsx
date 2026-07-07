import { Route, Plus, Trash2 } from 'lucide-react';
import { AdminCard } from './ui/AdminCard';
import { AdminInput } from './ui/AdminInput';

interface Range { _id: string; maxKm: number; price: number; }
interface NRange { maxKm: string; price: string; }

interface Props {
  ranges: Range[];
  nRange: NRange;
  setNRange: (updater: (prev: NRange) => NRange) => void;
  rErr: string;
  addRange: () => void;
  deleteRange: (id: string) => void;
}

export function RangesSection({ ranges, nRange, setNRange, rErr, addRange, deleteRange }: Props) {
  return (
    <AdminCard>
      <div className="flex items-center gap-2 mb-4">
        <Route className="w-4 h-4 text-primary" />
        <h2 className="font-semibold text-white text-sm">Rangos por Kilómetro</h2>
      </div>
      <div className="flex flex-col gap-2 mb-4 max-h-80 overflow-y-auto overscroll-contain scrollbar-none">
        {ranges.length === 0 && <p className="text-white/25 text-xs text-center py-3">Sin rangos configurados</p>}
        {ranges.map(r => (
          <div key={r._id} className="flex items-center justify-between bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3">
            <span className="text-white text-sm">Hasta <span className="text-primary">{r.maxKm} km</span></span>
            <div className="flex items-center gap-3">
              <span className="text-primary">${r.price.toLocaleString('es-AR')}</span>
              <button onClick={() => deleteRange(r._id)} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
        <p className="text-white/60 text-xs mb-2">Agregar rango</p>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <AdminInput type="number" placeholder="Máx. km" value={nRange.maxKm} onChange={e => setNRange(p => ({ ...p, maxKm: e.target.value }))} min={0} className="py-2" />
          <AdminInput type="number" placeholder="Precio ($)" value={nRange.price} onChange={e => setNRange(p => ({ ...p, price: e.target.value }))} min={0} className="py-2" />
        </div>
        {rErr && <p className="text-red-400 text-xs mb-2">{rErr}</p>}
        <button onClick={addRange} className="flex items-center gap-1.5 text-primary border border-primary/30 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">
          <Plus className="w-3.5 h-3.5" />Agregar rango
        </button>
      </div>
    </AdminCard>
  );
}
