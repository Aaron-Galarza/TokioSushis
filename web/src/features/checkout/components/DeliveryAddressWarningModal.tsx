'use client';

import { AlertTriangle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeliveryAddressWarningModal = ({ isOpen, onConfirm, onCancel }: Props) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm border border-white/10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-base font-semibold text-white">Dirección no encontrada</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-white/50 hover:text-white/90 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-white/70 leading-relaxed">
            No encontramos tu dirección para estimar el envío, pero en breves te lo decimos por WhatsApp.
          </p>
        </div>

        <div className="flex flex-col gap-2 p-5 pt-0">
          <button
            onClick={onConfirm}
            className="w-full px-4 py-2.5 rounded-xl bg-primary text-black hover:bg-primary/90 transition-colors text-sm font-semibold active:scale-95"
          >
            Continuar con el pedido
          </button>
          <button
            onClick={onCancel}
            className="w-full px-4 py-2.5 rounded-xl border border-white/20 text-white/80 hover:bg-white/5 transition-colors text-sm font-medium active:scale-95"
          >
            Elegir otra dirección
          </button>
        </div>
      </div>
    </div>
  );
};
