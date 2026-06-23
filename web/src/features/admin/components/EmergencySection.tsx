import { AlertCircle, Power } from 'lucide-react';
import { AdminCard } from './ui/AdminCard';

interface Props {
  emergency: boolean;
  onToggle: () => void;
}

export function EmergencySection({ emergency, onToggle }: Props) {
  return (
    <AdminCard>
      <h2 className="font-semibold text-white text-sm mb-4">Estado del Local</h2>
      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-2 mb-4">
          <AlertCircle className="w-4 h-4 text-primary/70 shrink-0 mt-0.5" />
          <p className="text-white/40 text-xs">El botón de pánico ignora los horarios y cierra la recepción de pedidos de forma inmediata.</p>
        </div>
        <button onClick={onToggle}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${emergency ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}>
          <Power className="w-4 h-4" />
          {emergency ? 'Reabrir Local' : 'Cerrar de Emergencia'}
        </button>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className={`w-2 h-2 rounded-full ${emergency ? 'bg-red-500' : 'bg-green-500'}`} />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">{emergency ? 'CIERRE DE EMERGENCIA ACTIVO' : 'OPERANDO NORMALMENTE'}</span>
        </div>
      </div>
    </AdminCard>
  );
}
