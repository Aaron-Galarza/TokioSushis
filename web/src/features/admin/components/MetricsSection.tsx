import { TrendingUp, DollarSign, CreditCard, Trophy, Loader2 } from 'lucide-react';
import { AdminCard } from './ui/AdminCard';
import { AdminSelect } from './ui/AdminInput';

interface Analytics {
  total?: number;
  efectivo?: number;
  trans?: number;
  entregados?: number;
  topProduct?: { title: string };
}

interface Props {
  analytics: Analytics | null;
  aLoading: boolean;
  aRange: string;
  onRangeChange: (val: any) => void;
}

const RANGES = ['hoy', 'ayer', 'semana', 'mes'] as const;

const buildMetrics = (a: Analytics) => [
  { icon: TrendingUp, label: 'Ventas Totales', v: `$${a.total?.toLocaleString('es-AR')}` },
  { icon: DollarSign, label: 'En Efectivo', v: `$${a.efectivo?.toLocaleString('es-AR')}` },
  { icon: CreditCard, label: 'Transferencia', v: `$${a.trans?.toLocaleString('es-AR')}` },
  { icon: Trophy, label: 'Entregados', v: String(a.entregados ?? 0) },
  { icon: Trophy, label: 'Producto Estrella', v: a.topProduct?.title || '—' },
];

export function MetricsSection({ analytics, aLoading, aRange, onRangeChange }: Props) {
  return (
    <AdminCard>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-white text-sm">Métricas de Negocio</h2>
        <AdminSelect value={aRange} onChange={e => onRangeChange(e.target.value)} className="w-auto px-3 py-1.5 text-xs">
          {RANGES.map(r => <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>)}
        </AdminSelect>
      </div>
      {aLoading
        ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        : analytics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {buildMetrics(analytics).map(m => (
              <div key={m.label} className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-1.5 text-[11px] text-white/35 mb-2">
                  <m.icon className="w-3.5 h-3.5 text-primary" />{m.label}
                </div>
                <p className="font-bold text-primary text-lg leading-tight truncate">{m.v}</p>
              </div>
            ))}
          </div>
        )}
    </AdminCard>
  );
}
