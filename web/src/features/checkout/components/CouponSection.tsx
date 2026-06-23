import { CheckCircle } from 'lucide-react';
import type { Coupon } from '@/types';

interface Props {
  couponCode: string;
  couponLoading: boolean;
  couponError: string;
  appliedCoupon: Coupon | null;
  onInput: (v: string) => void;
  onApply: () => void;
}

export function CouponSection({ couponCode, couponLoading, couponError, appliedCoupon, onInput, onApply }: Props) {
  return (
    <div className="bg-[#161616] border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex gap-2">
        <input type="text" placeholder="Código de cupón" value={couponCode} onChange={e => onInput(e.target.value)}
          className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/30 text-sm" />
        <button onClick={onApply} disabled={couponLoading || !couponCode.trim()}
          className="bg-primary/20 border border-primary/30 text-primary font-bold px-4 rounded-xl text-sm hover:bg-primary/30 disabled:opacity-40 transition-colors">
          {couponLoading ? '...' : 'Aplicar'}
        </button>
      </div>
      {couponError && <p className="text-red-400 text-xs">{couponError}</p>}
      {appliedCoupon && (
        <div className="flex items-center gap-2 text-green-400 text-xs">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Cupón aplicado: <span className="font-bold">{appliedCoupon.discountPercent}% de descuento</span></span>
        </div>
      )}
    </div>
  );
}
