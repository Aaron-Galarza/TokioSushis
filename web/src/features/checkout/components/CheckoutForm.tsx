interface Props {
  name: string;
  phone: string;
  notes: string; // 👈 Nueva prop
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onNotesChange: (v: string) => void; // 👈 Nueva prop
}

export function CheckoutForm({ name, phone, notes, onNameChange, onPhoneChange, onNotesChange }: Props) {
  const MAX_NOTES_LENGTH = 60;

  return (
    <div className="bg-[#161616] border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
      <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1 pl-1">
        Datos del cliente
      </h3>
      <input 
        type="text" 
        placeholder="Nombre para el pedido" 
        value={name} 
        onChange={e => onNameChange(e.target.value)}
        className="bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/25 text-sm w-full focus:outline-none focus:border-primary/50 transition-colors" 
      />
      <input 
        type="tel" 
        placeholder="Teléfono (ej: 3624XXXXXX)" 
        value={phone} 
        onChange={e => onPhoneChange(e.target.value)}
        className="bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/25 text-sm w-full focus:outline-none focus:border-primary/50 transition-colors" 
      />

      <div className="mt-2">
        <div className="flex justify-between items-center mb-1.5 pl-1">
          <label className="text-xs font-bold uppercase tracking-widest text-white/40">
            Aclaraciones / Notas
          </label>
          <span className={`text-[10px] font-mono ${notes.length >= MAX_NOTES_LENGTH ? 'text-red-400 font-bold' : 'text-white/30'}`}>
            {notes.length}/{MAX_NOTES_LENGTH}
          </span>
        </div>
        <textarea 
          placeholder="Ej: sin sesamo, jengibre extra, timbre roto..." 
          value={notes} 
          maxLength={60} // 👈 Bajamos el límite visual a 60 caracteres
  onChange={e => {
    const rawValue = e.target.value;
    
    // 🛡️ Filtro estricto: Solo letras (incluye tildes, ñ) y espacios. Todo a minúsculas.
    const cleanValue = rawValue
      .toLowerCase()
      .replace(/[^a-zñáéíóúü\s]/g, ''); // Elimina números, emojis, símbolos, barras, etc.
    
            onNotesChange(cleanValue);
          }}
          rows={2}
          className="bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/25 text-sm w-full focus:outline-none focus:border-primary/50 transition-colors resize-none" 
        />
      </div>
    </div>
  );
}