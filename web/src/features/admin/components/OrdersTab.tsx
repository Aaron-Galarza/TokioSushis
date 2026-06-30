import { AdminCard } from './ui/AdminCard';
import { OrdersPanel } from './OrdersPanel';
import { QuickOrderForm } from './QuickOrderForm';
import type { useAdminOrders } from '../hooks/useAdminOrders';
import type { useAdminMenu } from '../hooks/useAdminMenu';
import type { AdminRange } from '@/services/admin.service';

type OrdersHook = ReturnType<typeof useAdminOrders>;
type MenuHook   = ReturnType<typeof useAdminMenu>;

// 📅 Agregado "Ayer" a los filtros temporales de pedidos
const TIME_FILTERS: { v: AdminRange; l: string }[] = [
  { v: 'hoy', l: 'Hoy' },
  { v: 'ayer', l: 'Ayer' },
  { v: 'semana', l: 'Esta semana' },
  { v: 'mes', l: 'Este mes' },
];

export function OrdersTab({ hook, menu }: { hook: OrdersHook; menu: MenuHook }) {
  return (
    <AdminCard>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="font-semibold text-white text-sm">Panel de Pedidos</h2>
        
        {/* Selector de Rango Temporal */}
        <div className="flex bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-0.5 text-xs font-medium self-start sm:self-auto">
          {TIME_FILTERS.map(f => (
            <button
              key={f.v}
              type="button"
              onClick={() => hook.setTRange(f.v)}
              className={`px-3 py-1.5 rounded-md transition-all ${
                hook.tRange === f.v 
                  ? 'bg-primary text-black font-semibold' 
                  : 'text-white/40 hover:text-white'
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      <QuickOrderForm
        products={menu.products}
        addons={menu.addons}
        onSuccess={hook.reload}
      />

      <OrdersPanel
        sFilter={hook.sFilter}
        setSFilter={hook.setSFilter}
        oCounts={hook.oCounts}
        filteredOrders={hook.filteredOrders}
        expandedId={hook.expandedId}
        setExpandedId={hook.setExpandedId}
        updateStatus={hook.updateStatus}
        onRefresh={hook.reload}
      />
    </AdminCard>
  );
}