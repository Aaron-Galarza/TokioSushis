import { AdminCard } from './ui/AdminCard';
import { OrdersPanel } from './OrdersPanel';
import type { useAdminOrders } from '../hooks/useAdminOrders';

type OrdersHook = ReturnType<typeof useAdminOrders>;

export function OrdersTab({ hook }: { hook: OrdersHook }) {
  return (
    <AdminCard>
      <h2 className="font-semibold text-white text-sm mb-4">Panel de Pedidos</h2>
      <OrdersPanel
        sFilter={hook.sFilter}
        setSFilter={hook.setSFilter}
        oCounts={hook.oCounts}
        filteredOrders={hook.filteredOrders}
        expandedId={hook.expandedId}
        setExpandedId={hook.setExpandedId}
        updateStatus={hook.updateStatus}
      />
    </AdminCard>
  );
}
