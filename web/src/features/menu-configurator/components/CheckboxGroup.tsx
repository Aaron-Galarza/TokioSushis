'use client';

import { Check } from 'lucide-react';

interface CheckboxGroupOption {
  id: string;
  label: string;
  description?: string;
  price?: number;
  isExtra?: boolean;
  priceLabel?: string;
  type: 'checkbox';
}

interface CheckboxGroupProps {
  options: CheckboxGroupOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  className?: string;
  disabled?: boolean;
  minSelections?: number;
  maxSelections?: number;
  columns?: 1 | 2;
}

export const CheckboxGroup = ({
  options,
  selectedValues,
  onChange,
  className = '',
  disabled = false,
  minSelections = 0,
  maxSelections,
  columns = 2
}: CheckboxGroupProps) => {
  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];

    if (maxSelections && newValues.length > maxSelections) return;
    onChange(newValues);
  };

  const isMaxReached = Boolean(maxSelections && selectedValues.length >= maxSelections);
  const gridCols = columns === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2';

  return (
    <div className={`space-y-3 ${className}`}>
      {(minSelections > 0 || maxSelections) && (
        <p className="text-xs text-white/50 mb-2">
          {maxSelections
            ? `Selecciona ${minSelections > 0 ? `mínimo ${minSelections} y ` : ''}máximo ${maxSelections} ${maxSelections === 1 ? 'opción' : 'opciones'}`
            : `Selecciona al menos ${minSelections} ${minSelections === 1 ? 'opción' : 'opciones'}`
          }
        </p>
      )}
      <div className={`grid ${gridCols} gap-3`}>
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.id);
          const isDisabled = disabled || (isMaxReached && !isSelected);

          return (
            <button
              key={option.id}
              onClick={() => !isDisabled && handleToggle(option.id)}
              disabled={isDisabled}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
              } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div className={`relative w-5 h-5 md:w-6 md:h-6 rounded border-2 flex items-center justify-center shrink-0 ${
                isSelected ? 'border-primary bg-primary' : 'border-white/30'
              }`}>
                {isSelected && <Check className="w-3 h-3 md:w-4 md:h-4 text-black" />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-white text-sm md:text-base truncate block">{option.label}</span>
                {option.description && (
                  <p className="text-xs text-white/50 mt-0.5">{option.description}</p>
                )}
              </div>
              {option.priceLabel ? (
                <span className="text-sm md:text-base font-bold text-primary whitespace-nowrap">{option.priceLabel}</span>
              ) : option.isExtra && option.price ? (
                <span className="text-sm md:text-base font-bold text-primary whitespace-nowrap">+${option.price.toLocaleString()}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};