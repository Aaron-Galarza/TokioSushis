import { Store, AlertOctagon } from 'lucide-react';

interface StoreClosedProps {
  message?: string;
}

export const StoreClosed = ({ message }: StoreClosedProps) => {
  return (
    <section className="mb-7 flex animate-in flex-col gap-4 rounded-3xl border border-white/10 bg-primary/70 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.4)] fade-in duration-300 sm:flex-row sm:items-start sm:p-6">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-secondary/45 bg-secondary/15 text-secondary">
        <AlertOctagon className="h-6 w-6" />
      </div>

      <div className="flex-1 text-center sm:text-left">
        <h3 className="font-heading text-2xl font-bold text-white">El local se encuentra cerrado</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-white/70">
          {message || 'En este momento no estamos tomando pedidos. Podes mirar el menu y preparar tu orden.'}
        </p>
      </div>

      <div className="hidden shrink-0 text-white/30 sm:block">
        <Store className="h-11 w-11" />
      </div>
    </section>
  );
};
