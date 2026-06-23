import { CloudRain, Sun } from 'lucide-react';
import { AdminCard } from './ui/AdminCard';
import { AdminInput } from './ui/AdminInput';

interface Props {
  isRaining: boolean;
  extraRain: number;
  setExtraRain: (v: number) => void;
  toggleRain: () => void;
}

export function RainSection({ isRaining, extraRain, setExtraRain, toggleRain }: Props) {
  return (
    <AdminCard>
      <div className="flex items-center gap-2 mb-4">
        {isRaining ? <CloudRain className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-yellow-400" />}
        <h2 className="font-semibold text-white text-sm">Modo Lluvia</h2>
      </div>
      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4 flex items-center justify-between mb-3">
        <div>
          <p className="text-white text-sm">Recargo por lluvia</p>
          <p className="text-white/40 text-xs">Se suma al costo base de envío</p>
        </div>
        <button onClick={toggleRain} className={`relative w-11 h-6 rounded-full transition-colors ${isRaining ? 'bg-blue-500' : 'bg-white/10'}`}>
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isRaining ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
        </button>
      </div>
      <div>
        <p className="text-white/40 text-xs mb-1.5">Recargo extra ($)</p>
        <AdminInput type="number" value={extraRain} onChange={e => setExtraRain(Number(e.target.value))} min={0} />
        {isRaining && <p className="text-blue-400 text-xs mt-2">Modo lluvia activo — recargo de ${extraRain.toLocaleString('es-AR')}</p>}
      </div>
    </AdminCard>
  );
}
