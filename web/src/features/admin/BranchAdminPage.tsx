'use client';
import { useState, useEffect, useRef } from 'react';
import { BarChart3, ShoppingBag, Utensils, Tag, Settings, ImageIcon } from 'lucide-react';
import { useAdminOrders } from '@/features/admin/hooks/useAdminOrders';
import { useAdminCoupons } from '@/features/admin/hooks/useAdminCoupons';
import { useAdminMenu } from '@/features/admin/hooks/useAdminMenu';
import { OverviewTab } from '@/features/admin/components/OverviewTab';
import { OrdersTab } from '@/features/admin/components/OrdersTab';
import { MenuTab } from '@/features/admin/components/MenuTab';
import { CouponsTab } from '@/features/admin/components/CouponsTab';
import { GalleryTab } from '@/features/admin/components/GalleryTab';
import { ConfigTab } from '@/features/admin/components/ConfigTab';
import { CashierMenuTab } from '@/features/admin/components/CashierMenuTab';
import { useAuthStore } from '@/stores/auth.store';

type Tab = 'overview' | 'orders' | 'menu' | 'coupons' | 'gallery' | 'config';

const NAVT = [
  { k: 'overview' as Tab, l: 'Vista General', I: BarChart3 },
  { k: 'orders'   as Tab, l: 'Pedidos',       I: ShoppingBag },
  { k: 'menu'     as Tab, l: 'Menú',          I: Utensils },
  { k: 'coupons'  as Tab, l: 'Cupones',       I: Tag },
  { k: 'gallery'  as Tab, l: 'Galería',       I: ImageIcon },
  { k: 'config'   as Tab, l: 'Configuración', I: Settings },
];

export default function AdminPage() {
  const role = useAuthStore((s) => s.role);
  const isManager = role === 'encargado';
  const [tab, setTab] = useState<Tab>('orders');
  const ordersHook  = useAdminOrders();
  const couponsHook = useAdminCoupons(isManager);
  const menuHook    = useAdminMenu();

  // Cargamos el menú una sola vez cuando se entra a "orders" por primera vez.
  // El ref evita recargas y mantiene el array de dependencias en tamaño constante.
  const ordersMenuLoaded = useRef(false);
  useEffect(() => {
    if (tab === 'orders' && !ordersMenuLoaded.current) {
      ordersMenuLoaded.current = true;
      menuHook.reload();
    }
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const pendingCount = ordersHook?.oCounts?.pending ?? 0;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <nav className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10 bg-[#0A0A0A] overflow-x-auto scrollbar-none shrink-0">
        {NAVT.filter(({ k }) => isManager || k === 'orders' || k === 'menu').map(({ k, l, I }) => {
          const isA = tab === k;
          return (
            <button key={k} onClick={() => setTab(k)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all active:scale-95
                ${isA ? 'bg-primary text-black' : 'border border-white/15 text-white/50 hover:text-white hover:border-white/30'}`}>
              <I className="w-3.5 h-3.5" />
              {l}
              {k === 'orders' && pendingCount > 0 && (
                <span className={`text-[10px] font-bold ml-0.5 px-1.5 py-0.5 rounded-full
                  ${isA ? 'bg-black/20 text-black' : 'bg-yellow-400/20 text-yellow-400'}`}>
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-6xl mx-auto p-5 md:p-6">
          {tab === 'overview' && isManager && <OverviewTab />}
          {tab === 'orders'   && <OrdersTab hook={ordersHook} menu={menuHook} canDelete={isManager} />}
          {tab === 'menu'     && (isManager ? <MenuTab /> : <CashierMenuTab />)}
          {tab === 'coupons'  && isManager && <CouponsTab hook={couponsHook} />}
          {tab === 'gallery'  && isManager && <GalleryTab />}
          {tab === 'config'   && isManager && <ConfigTab />}
        </div>
      </div>
    </div>
  );
}
