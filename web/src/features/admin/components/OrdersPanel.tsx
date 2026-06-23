import { OrderRow } from './OrdersRows';
import type { SF } from '../hooks/useAdminOrders';

const STABS: { key: SF; label: string; dot: string }[] = [
  { key: 'pending', label: 'Pendientes', dot: 'bg-yellow-400' },
  { key: 'in-preparation', label: 'En Proceso', dot: 'bg-blue-400' },
  { key: 'completed', label: 'Terminados', dot: 'bg-green-400' },
  { key: 'cancelled', label: 'Cancelados', dot: 'bg-red-500' },
];

interface Props {
  sFilter: SF;
  setSFilter: (f: SF) => void;
  oCounts: Record<SF, number>;
  filteredOrders: any[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  updateStatus: (id: string, status: string) => Promise<void>;
}

export function OrdersPanel({ sFilter, setSFilter, oCounts, filteredOrders, expandedId, setExpandedId, updateStatus }: Props) {
  return (
    <>
      <div className="flex gap-2 flex-wrap mb-4">
        {STABS.map(st => {
          const count = oCounts[st.key]; const isA = sFilter === st.key;
          return (
            <button key={st.key} onClick={() => setSFilter(st.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${isA ? 'bg-primary text-black' : 'border border-white/15 text-white/40 hover:text-white hover:border-white/30'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isA ? 'bg-black/30' : st.dot}`} />
              {st.label}
              {count > 0 && <span className={isA ? 'text-black/70' : 'text-white/50'}>{count}</span>}
            </button>
          );
        })}
      </div>
      <div className="overflow-y-auto overscroll-contain max-h-[55vh]">
        {filteredOrders.length === 0 && <p className="text-white/20 text-sm py-6 text-center">Sin pedidos en esta categoría.</p>}
        {filteredOrders.map(o => (
          <OrderRow key={o._id} order={o} expanded={expandedId === o._id}
            onToggle={() => setExpandedId(expandedId === o._id ? null : o._id)}
            onStatus={updateStatus} />
        ))}
      </div>
    </>
  );
}
