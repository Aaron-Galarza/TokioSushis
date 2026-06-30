import { OrderRow } from './OrdersRows';
import { ORDER_STATUS, type OrderStatusKey } from '@/constants/orderStatus';
import type { SF } from '../hooks/useAdminOrders';

// Mapeo de filtros del panel → claves de ORDER_STATUS
// 'completed' en el filtro corresponde a 'ready' en la DB
const FILTER_TO_STATUS: Record<SF, OrderStatusKey> = {
  pending:          'pending',
  'in-preparation': 'in-preparation',
  completed:        'ready',
  delivered:        'delivered',
  cancelled:        'cancelled',
};

const FILTER_KEYS: SF[] = ['pending', 'in-preparation', 'completed', 'delivered', 'cancelled'];

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
      <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 mb-5">
        {FILTER_KEYS.map(key => {
          const status = ORDER_STATUS[FILTER_TO_STATUS[key]];
          const count  = oCounts[key];
          const isA    = sFilter === key;
          const Icon   = status.icon;
          return (
            <button
              key={key}
              onClick={() => setSFilter(key)}
              className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-all active:scale-95
                ${isA
                  ? status.tabColor
                  : 'bg-[#1A1A1A] text-white/40 border-[#2A2A2A] hover:text-white hover:border-white/20'
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{status.pluralLabel}</span>
              <span className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full shrink-0 ${isA ? 'bg-white/20' : 'bg-white/5'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

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