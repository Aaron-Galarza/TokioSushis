import { CloudRain, Sun } from 'lucide-react';
import { AdminCard } from './ui/AdminCard';
import { AdminInput } from './ui/AdminInput';

interface Props {
  isRaining: boolean;
  extraRain: number;
  setExtraRain: (v: number) => void;
  toggleRain: () => void;
  saving: boolean;
  error: string;
}

export function RainSection({ isRaining, extraRain, setExtraRain, toggleRain, saving, error }: Props) {
  return (
    <AdminCard>
      <div className="flex items-center gap-2 mb-4">
        {isRaining ? <CloudRain className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-yellow-400" />}
        <h2 className="font-semibold text-white text-sm">Modo Lluvia</h2>
      </div>
      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4 flex items-center gap-3 mb-3 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="text-white text-sm">Recargo por lluvia</p>
          <p className="text-white/40 text-xs">Se suma al costo base de envío</p>
        </div>
        <button type="button" role="switch" aria-checked={isRaining}
          aria-label={isRaining ? 'Desactivar recargo por lluvia' : 'Activar recargo por lluvia'}
          onClick={toggleRain} disabled={saving}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 ${isRaining ? 'bg-blue-500' : 'bg-white/15'}`}>
          <span aria-hidden="true" className={`pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isRaining ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>
      <div className="min-w-0">
        <p className="text-white/40 text-xs mb-1.5">Recargo extra ($)</p>
        <AdminInput type="number" value={extraRain} onChange={e => setExtraRain(Number(e.target.value))} min={0} />
        {isRaining && <p className="text-blue-400 text-xs mt-2">Modo lluvia activo — recargo de ${extraRain.toLocaleString('es-AR')}</p>}
        {error && <p role="alert" className="mt-2 text-xs text-red-400">{error}</p>}
      </div>
    </AdminCard>
  );
}
