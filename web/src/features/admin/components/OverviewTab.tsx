import { useEffect, useState, useCallback } from 'react';
import { AlertCircle, Power } from 'lucide-react';
import { AdminCard } from './ui/AdminCard';
import { MetricsSection } from './MetricsSection';
import { CouponsSection } from './CouponsSection';
import { MenuManagementSection } from './MenuManagementSection';
import { useAdminOverview } from '../hooks/useAdminOverview';
import { useAdminOrders } from '../hooks/useAdminOrders';
import { useAdminCoupons } from '../hooks/useAdminCoupons';
import { useAdminMenu } from '../hooks/useAdminMenu';
import { toggleEmergency as apiToggle, fetchConfigStatus } from '@/services/admin.service';

export function OverviewTab() {
  const overview = useAdminOverview();
  const orders = useAdminOrders();
  const coupons = useAdminCoupons();
  const menu = useAdminMenu();
  const [emergency, setEmergency] = useState(false);

  const loadAll = useCallback(async () => {
    await Promise.all([overview.reload(), coupons.reload(), menu.reload()]);
    try { const c = await fetchConfigStatus(); setEmergency(c.isEmergencyClosed ?? false); } catch {}
  }, [overview, coupons, menu]);

  useEffect(() => { loadAll(); }, []);

  return (
    <div className="space-y-5">
      <MetricsSection
        analytics={overview.analytics}
        aLoading={overview.aLoading}
        aRange={overview.aRange}
        onRangeChange={overview.changeRange}
      />

      <CouponsSection orders={orders} coupons={coupons} />

      <MenuManagementSection menu={menu} />

      <AdminCard>
        <h2 className="font-semibold text-white text-sm mb-3">Estado del Local</h2>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-primary/70 shrink-0" />
              <p className="text-white text-sm font-semibold">Botón de Pánico</p>
            </div>
            <p className="text-white/40 text-xs">Cierra la recepción de pedidos de forma inmediata, ignorando los horarios.</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`w-2 h-2 rounded-full ${emergency ? 'bg-red-500' : 'bg-green-500'}`} />
              <span className="text-white/50 text-xs font-semibold uppercase tracking-wide">{emergency ? 'LOCAL CERRADO' : 'OPERANDO NORMALMENTE'}</span>
            </div>
          </div>
          <button onClick={async () => setEmergency(await apiToggle())}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 shrink-0 ${emergency ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}>
            <Power className="w-4 h-4" />
            {emergency ? 'Reabrir' : 'Cerrar Local'}
          </button>
        </div>
      </AdminCard>
    </div>
  );
}
