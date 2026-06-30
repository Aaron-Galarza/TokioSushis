'use client';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Receipt } from 'lucide-react';
import { useCheckout } from '@/features/checkout/hooks/useCheckout';
import { DeliveryTypeSelector } from '@/features/checkout/components/DeliveryTypeSelector';
import { CheckoutAddressAdapter } from '@/features/checkout/components/CheckoutAddressAdapter';
import { DeliveryCostPreview } from '@/features/checkout/components/DeliveryCostPreview';
import { AddressMap } from '@/features/checkout/components/AddressMap';
import { CheckoutForm } from '@/features/checkout/components/CheckoutForm';
import { CouponSection } from '@/features/checkout/components/CouponSection';
import { SummarySection } from '@/features/checkout/components/SummarySection';

// 💳 Métodos de pago reales unificados
const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  debito: 'Débito',
  credito: 'Crédito',
};

export default function CheckoutPage() {
  const {
    items, deliveryType, coupon, isDeliveryLoading,
    name, setName, phone, setPhone,
    notes, setNotes, // 📝 Se agregan aquí para extraerlos correctamente del hook
    paymentMethod, setPaymentMethod,
    couponCode, couponLoading, couponError, validateCoupon, handleCouponInput,
    submitting, submitError, isConfirmDisabled, handleConfirmOrder,
    subtotal, discount, total,
  } = useCheckout();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-xl border-b border-white/10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <Link href="/cart" className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/90">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-heading text-xl tracking-wide text-white mt-1">FINALIZAR PEDIDO</h1>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-6 pb-12 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        <section>
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3 px-1">Método de entrega</h2>
          <DeliveryTypeSelector />
        </section>

        {deliveryType === 'delivery' && (
          <section className="animate-in fade-in slide-in-from-top-2 duration-300">
            <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3 px-1">¿A dónde lo enviamos?</h2>
            <div className="flex flex-col gap-2">
              <CheckoutAddressAdapter />
              <DeliveryCostPreview />
              <AddressMap />
            </div>
          </section>
        )}

        <section>
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3 px-1">Tus datos</h2>
          <CheckoutForm
            name={name}
            phone={phone}
            notes={notes}
            onNameChange={setName}
            onPhoneChange={setPhone}
            onNotesChange={setNotes}
          />
        </section>

        <section>
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3 px-1">Método de pago</h2>
          <div className="flex gap-2">
            {Object.entries(PAYMENT_LABELS).map(([method, label]) => (
              <button 
                key={method} 
                onClick={() => setPaymentMethod(method as any)}
                className={`flex-1 py-2.5 px-2 rounded-xl font-bold text-sm transition-all
                  ${paymentMethod === method
                    ? 'bg-primary text-black'
                    : 'bg-[#1A1A1A] border border-white/10 text-white/60 hover:text-white'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3 px-1">Cupón (opcional)</h2>
          <CouponSection
            couponCode={couponCode}
            couponLoading={couponLoading}
            couponError={couponError}
            appliedCoupon={coupon}
            onInput={handleCouponInput}
            onApply={validateCoupon}
          />
        </section>

        <section>
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
            <Receipt className="w-4 h-4" /> Resumen de pago
          </h2>
          <SummarySection
            items={items}
            subtotal={subtotal}
            discount={discount}
            total={total}
            deliveryType={deliveryType}
            isDeliveryLoading={isDeliveryLoading}
          />
        </section>

        {submitError && (
          <p className="text-red-400 text-sm text-center bg-red-400/10 px-4 py-2 rounded-xl">{submitError}</p>
        )}

        <section className="mt-2">
          <button
            onClick={handleConfirmOrder}
            disabled={isConfirmDisabled}
            className={`w-full py-4 px-6 rounded-xl font-extrabold text-lg flex items-center justify-center gap-2 transition-all duration-300
              ${isConfirmDisabled
                ? 'bg-zinc-800 text-white/30 cursor-not-allowed'
                : 'bg-primary text-black hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(197,168,111,0.2)]'
              }`}
          >
            {submitting ? 'Enviando pedido...' : isDeliveryLoading ? 'Calculando envío...' : 'Confirmar Pedido'}
            {!isConfirmDisabled && <CheckCircle2 className="w-5 h-5" />}
          </button>
        </section>

      </main>
    </div>
  );
}