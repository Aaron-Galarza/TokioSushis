'use client';

import { Check } from 'lucide-react';

interface RadioGroupOption {
  id: string;
  label: string;
  description?: string;
  price?: number;
  isExtra?: boolean;
  priceLabel?: string;
  type: 'radio';
}

interface RadioGroupProps {
  options: RadioGroupOption[];
  selectedValue: string | null;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  columns?: 1 | 2 | 3;
}

export const RadioGroup = ({
  options,
  selectedValue,
  onChange,
  className = '',
  disabled = false,
  columns = 2
}: RadioGroupProps) => {
  const gridCols = columns === 1 ? 'grid-cols-1' : columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid ${gridCols} gap-3 md:gap-4 ${className}`}>
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => !disabled && onChange(option.id)}
          disabled={disabled}
          className={`relative group flex flex-col items-start p-4 md:p-5 rounded-2xl border-2 transition-all ${
            selectedValue === option.id
              ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(197,168,111,0.15)]'
              : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`relative w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center ${
              selectedValue === option.id ? 'border-primary bg-primary' : 'border-white/30'
            }`}>
              {selectedValue === option.id && <Check className="w-3 h-3 md:w-4 md:h-4 text-black" />}
            </div>
            <span className="font-semibold text-white text-sm md:text-base">{option.label}</span>
          </div>
          {option.description && (
            <p className="text-xs text-white/50 ml-7 md:ml-8">{option.description}</p>
          )}
          {option.priceLabel ? (
            <span className="mt-2 ml-7 md:ml-8 text-xs font-bold text-primary">{option.priceLabel}</span>
          ) : option.isExtra && option.price ? (
            <span className="mt-2 ml-7 md:ml-8 text-xs font-bold text-primary">+${option.price.toLocaleString()}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
};