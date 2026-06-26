import { AdminCard } from './ui/AdminCard';
import { OrdersPanel } from './OrdersPanel';
import { QuickOrderForm } from './QuickOrderForm';
import type { useAdminOrders } from '../hooks/useAdminOrders';
import type { useAdminMenu } from '../hooks/useAdminMenu';

type OrdersHook = ReturnType<typeof useAdminOrders>;
type MenuHook   = ReturnType<typeof useAdminMenu>;

export function OrdersTab({ hook, menu }: { hook: OrdersHook; menu: MenuHook }) {
  return (
    <AdminCard>
      <h2 className="font-semibold text-white text-sm mb-4">Panel de Pedidos</h2>

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
      />
    </AdminCard>
  );
}