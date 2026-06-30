'use client';

import { CATEGORY_ICON_OPTIONS } from '@/lib/categoryIcons';

interface IconPickerModalProps {
  selected: string;
  onSelect: (name: string) => void;
  onClose: () => void;
}

export function IconPickerModal({ selected, onSelect, onClose }: IconPickerModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-5 w-80 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-white text-sm font-semibold">Elegir ícono</p>
          <button onClick={onClose} className="text-white/30 hover:text-white text-xs">✕</button>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {CATEGORY_ICON_OPTIONS.map(({ name, icon: Icon }) => (
            <button
              key={name}
              type="button"
              onClick={() => { onSelect(name); onClose(); }}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all
                ${selected === name
                  ? 'bg-primary/20 border-primary/50 text-primary'
                  : 'bg-[#0A0A0A] border-white/5 text-white/40 hover:border-white/20 hover:text-white/70'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] truncate w-full text-center">{name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}