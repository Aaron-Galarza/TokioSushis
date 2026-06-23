import { AdminCard } from './ui/AdminCard';
import { OrdersPanel } from './OrdersPanel';
import { CouponForm } from './CouponForm';
import { DS } from '@/constants/admin';
import type { SF } from '../hooks/useAdminOrders';

interface OrdersState {
  sFilter: SF;
  setSFilter: (v: SF) => void;
  oCounts: Record<SF, number>;
  filteredOrders: any[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  updateStatus: (id: string, status: string) => Promise<void>;
}

interface CouponsState {
  coupons: any[];
  cpForm: any;
  setCpForm: any;
  cpEditId: string | null;
  cpErr: string;
  save: () => void;
  cancel: () => void;
  toggleArr: (field: any, val: string) => void;
  edit: (coupon: any) => void;
}

interface Props {
  orders: OrdersState;
  coupons: CouponsState;
}

export function CouponsSection({ orders, coupons }: Props) {
  return (
    <div className="grid md:grid-cols-[3fr_2fr] gap-5">
      <AdminCard>
        <h2 className="font-semibold text-white text-sm mb-4">Panel de Pedidos</h2>
        <OrdersPanel
          sFilter={orders.sFilter}
          setSFilter={orders.setSFilter}
          oCounts={orders.oCounts}
          filteredOrders={orders.filteredOrders}
          expandedId={orders.expandedId}
          setExpandedId={orders.setExpandedId}
          updateStatus={orders.updateStatus}
        />
      </AdminCard>

      <div className="flex flex-col gap-4">
        <AdminCard>
          <h2 className="font-semibold text-white text-sm mb-3">Crear Cupón</h2>
          <CouponForm
            cpForm={coupons.cpForm}
            setCpForm={coupons.setCpForm}
            cpEditId={coupons.cpEditId}
            cpErr={coupons.cpErr}
            compact
            save={coupons.save}
            cancel={coupons.cancel}
            toggleArr={coupons.toggleArr}
          />
        </AdminCard>
        <AdminCard>
          <h2 className="font-semibold text-white text-sm mb-3">Cupones Activos</h2>
          {coupons.coupons.length === 0
            ? <p className="text-white/20 text-xs text-center py-3">Sin cupones activos.</p>
            : (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto overscroll-contain scrollbar-none">
                {coupons.coupons.filter(c => c.active).map(c => (
                  <div key={c._id} className="flex items-center justify-between bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-white text-sm font-bold">{c.code} <span className="text-primary">−{c.discountPercent}%</span></p>
                      <p className="text-white/30 text-[10px]">{c.validDays?.length ? c.validDays.map((d: string) => DS[d] || d).join(', ') : 'Todos los días'}</p>
                    </div>
                    <button onClick={() => coupons.edit(c)} className="text-white/30 hover:text-primary text-xs transition-colors">Editar</button>
                  </div>
                ))}
              </div>
            )}
        </AdminCard>
      </div>
    </div>
  );
}
