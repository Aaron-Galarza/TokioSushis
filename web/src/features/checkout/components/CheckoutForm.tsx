interface Props {
  name: string;
  phone: string;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
}

export function CheckoutForm({ name, phone, onNameChange, onPhoneChange }: Props) {
  return (
    <div className="bg-[#161616] border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
      <input type="text" placeholder="Nombre" value={name} onChange={e => onNameChange(e.target.value)}
        className="bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/30 text-sm w-full" />
      <input type="tel" placeholder="Teléfono" value={phone} onChange={e => onPhoneChange(e.target.value)}
        className="bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/30 text-sm w-full" />
    </div>
  );
}
