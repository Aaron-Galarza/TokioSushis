import { AdminCard } from './ui/AdminCard';
import { CouponForm } from './CouponForm';
import type { useAdminCoupons } from '../hooks/useAdminCoupons';

const DS: Record<string, string> = { monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié', thursday: 'Jue', friday: 'Vie', saturday: 'Sáb', sunday: 'Dom' };

type CouponsHook = ReturnType<typeof useAdminCoupons>;

export function CouponsTab({ hook }: { hook: CouponsHook }) {
  const { coupons, cpForm, setCpForm, cpEditId, cpErr, save, edit, remove, cancel, toggleArr } = hook;

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <AdminCard>
        <h2 className="font-semibold text-white text-sm mb-4">{cpEditId ? 'Editar Cupón' : 'Nuevo Cupón'}</h2>
        <CouponForm
          cpForm={cpForm}
          setCpForm={setCpForm}
          cpEditId={cpEditId}
          cpErr={cpErr}
          save={save}
          cancel={cancel}
          toggleArr={toggleArr}
        />
      </AdminCard>

      <AdminCard>
        <h2 className="font-semibold text-white text-sm mb-4">Cupones</h2>
        <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto overscroll-contain scrollbar-none">
          {coupons.map(c => (
            <div key={c._id} className="bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-white text-sm">
                  {c.code} — <span className="text-primary">{c.discountPercent}%</span>
                  {!c.active && <span className="ml-2 text-white/30 font-normal text-xs">(inactivo)</span>}
                </p>
                <p className="text-white/30 text-xs">
                  {c.validDays?.length ? `Días: ${c.validDays.map((d: string) => DS[d] || d).join(', ')}` : 'Todos los días'} · {c.validPaymentMethods?.length ? c.validPaymentMethods.join(', ') : 'Todos los métodos'}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => edit(c)} className="text-xs text-white/40 hover:text-white px-2 py-1 bg-white/5 rounded-lg">Editar</button>
                <button onClick={() => remove(c._id)} className="text-xs text-red-400/60 hover:text-red-300 px-2 py-1 bg-white/5 rounded-lg">Borrar</button>
              </div>
            </div>
          ))}
          {coupons.length === 0 && <p className="text-white/20 text-sm text-center py-4">Sin cupones creados.</p>}
        </div>
      </AdminCard>
    </div>
  );
}
