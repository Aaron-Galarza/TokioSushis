import { AdminInput } from './ui/AdminInput';
import { PAYS, CDAYS, DS } from '@/constants/admin';

interface Props {
  cpForm: { code: string; discountPercent: string; active: boolean; validDays: string[]; validPaymentMethods: string[] };
  setCpForm: (fn: (prev: any) => any) => void;
  cpEditId: string | null;
  cpErr: string;
  compact?: boolean;
  save: () => void;
  cancel: () => void;
  toggleArr: (field: 'validDays' | 'validPaymentMethods', val: string) => void;
}

export function CouponForm({ cpForm, setCpForm, cpEditId, cpErr, compact = false, save, cancel, toggleArr }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {cpErr && <p className="text-red-400 text-xs">{cpErr}</p>}
      <div className={compact ? 'flex gap-2' : 'flex flex-col gap-2'}>
        <AdminInput
          placeholder="CÓDIGO"
          value={cpForm.code}
          onChange={e => setCpForm((p: any) => ({ ...p, code: e.target.value.toUpperCase() }))}
          className={compact ? 'flex-1' : ''}
        />
        <AdminInput
          type="number"
          placeholder="% descuento"
          value={cpForm.discountPercent}
          onChange={e => setCpForm((p: any) => ({ ...p, discountPercent: e.target.value }))}
          className={compact ? 'w-32' : ''}
        />
      </div>

      {!compact && (
        <>
          <div>
            <p className="text-white/40 text-xs mb-1.5">Días válidos (vacío = todos)</p>
            <div className="flex flex-wrap gap-1.5">
              {CDAYS.map(d => (
                <button key={d} onClick={() => toggleArr('validDays', d)}
                  className={`px-2 py-1 rounded text-xs font-medium ${cpForm.validDays.includes(d) ? 'bg-primary text-black' : 'bg-[#1A1A1A] border border-white/10 text-white/50 hover:text-white'}`}>
                  {DS[d]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-white/40 text-xs mb-1.5">Métodos (vacío = todos)</p>
            <div className="flex gap-1.5">
              {PAYS.map(p => (
                <button key={p} onClick={() => toggleArr('validPaymentMethods', p)}
                  className={`px-2 py-1 rounded text-xs font-medium ${cpForm.validPaymentMethods.includes(p) ? 'bg-primary text-black' : 'bg-[#1A1A1A] border border-white/10 text-white/50 hover:text-white'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex gap-2">
        <button onClick={save} className="bg-primary text-black font-bold px-4 py-2 rounded-lg text-sm hover:bg-primary/90 active:scale-95 transition-all">
          {cpEditId ? 'Guardar' : 'Crear cupón'}
        </button>
        {cpEditId && (
          <button onClick={cancel} className="bg-white/5 text-white/50 px-4 py-2 rounded-lg text-sm hover:text-white">
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
