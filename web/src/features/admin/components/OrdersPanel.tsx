import { Clock, Package, CheckCircle, Truck, XCircle } from 'lucide-react';
import { OrderRow } from './OrdersRows';
import type { SF } from '../hooks/useAdminOrders';

const STABS: { key: SF; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'pending',        label: 'Pendientes', icon: Clock,       color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { key: 'in-preparation', label: 'En Proceso', icon: Package,     color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { key: 'completed',      label: 'Terminados', icon: CheckCircle, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { key: 'delivered',      label: 'Entregados', icon: Truck,       color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { key: 'cancelled',      label: 'Cancelados', icon: XCircle,     color: 'bg-red-500/20 text-red-400 border-red-500/30' },
];

interface Props {
  sFilter: SF;
  setSFilter: (f: SF) => void;
  oCounts: Record<SF, number>;
  filteredOrders: any[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  updateStatus: (id: string, status: string) => Promise<void>;
  onRefresh?: () => void;
}

export function OrdersPanel({ sFilter, setSFilter, oCounts, filteredOrders, expandedId, setExpandedId, updateStatus, onRefresh }: Props) {
  return (
    <>
      {/* Pestañas — grilla 2 filas de 3 en mobile, fila en desktop */}
      <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 mb-5">
        {STABS.map(st => {
          const count = oCounts[st.key];
          const isA   = sFilter === st.key;
          const Icon  = st.icon;
          return (
            <button
              key={st.key}
              onClick={() => setSFilter(st.key)}
              className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-all active:scale-95
                ${isA
                  ? st.color
                  : 'bg-[#1A1A1A] text-white/40 border-[#2A2A2A] hover:text-white hover:border-white/20'
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{st.label}</span>
              <span className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full shrink-0 ${isA ? 'bg-white/20' : 'bg-white/5'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Lista */}
      <div className="overflow-y-auto overscroll-contain max-h-[55vh]">
        {filteredOrders.length === 0 && (
          <p className="text-white/20 text-sm py-8 text-center">Sin pedidos en esta categoría.</p>
        )}
        {filteredOrders.map(o => (
          <OrderRow
            key={o._id}
            order={o}
            expanded={expandedId === o._id}
            onToggle={() => setExpandedId(expandedId === o._id ? null : o._id)}
            onStatus={updateStatus}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </>
  );
}