'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Receipt, Landmark, Check, Copy } from 'lucide-react';
import { useCheckout } from '@/features/checkout/hooks/useCheckout';
import { DeliveryTypeSelector } from '@/features/checkout/components/DeliveryTypeSelector';
import { CheckoutAddressAdapter } from '@/features/checkout/components/CheckoutAddressAdapter';
import { DeliveryCostPreview } from '@/features/checkout/components/DeliveryCostPreview';
import { AddressMap } from '@/features/checkout/components/AddressMap';
import { CheckoutForm } from '@/features/checkout/components/CheckoutForm';
import { CouponSection } from '@/features/checkout/components/CouponSection';
import { SummarySection } from '@/features/checkout/components/SummarySection';
import { PAYMENT_LABELS, TRANSFER_INFO } from '@/constants/admin';

export default function CheckoutPage() {
  const {
    items, deliveryType, coupon, isDeliveryLoading,
    name, setName, phone, setPhone,
    notes, setNotes, // 📝 Se agregan aquí para extraerlos correctamente del hook
    paymentMethod, setPaymentMethod,
    couponCode, couponLoading, couponError, validateCoupon, handleCouponInput,
    submitting, submitError, isConfirmDisabled, handleConfirmOrder,
    subtotal, discount, total, surcharge
  } = useCheckout();

  const [copied, setCopied] = useState(false);
  const handleCopyAlias = async () => {
    try {
      await navigator.clipboard.writeText(TRANSFER_INFO.alias);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

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

          {paymentMethod === 'transferencia' && (
            <div className="mt-3 bg-[#1A1A1A] border border-primary/25 rounded-xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 text-primary">
                <Landmark className="w-4 h-4" />
                <span className="text-sm font-bold">Datos para transferir</span>
              </div>
              <div className="flex items-center justify-between gap-3 bg-[#111] rounded-lg px-3 py-2.5">
                <div>
                  <p className="text-[11px] text-white/40 uppercase tracking-wider">Transferencia a</p>
                  <p className="text-white font-semibold text-sm">{TRANSFER_INFO.alias}</p>
                </div>
                <button
                  onClick={handleCopyAlias}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-semibold transition-all active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <div>
                <p className="text-[11px] text-white/40 uppercase tracking-wider">Titular</p>
                <p className="text-white font-semibold text-sm">{TRANSFER_INFO.holder}</p>
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed">
                Realizá la transferencia y enviános el comprobante por WhatsApp para confirmar tu pedido.
              </p>
            </div>
          )}
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
            surcharge={surcharge}
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