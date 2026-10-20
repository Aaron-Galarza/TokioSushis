'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { RadioGroup } from './RadioGroup';
import { CheckboxGroup } from './CheckboxGroup';
import { ProgressStepper } from './ProgressStepper';
import type { Configurator, ConfigStep } from '@/types/product';
import type { CartSelection } from '@/types/cart';
import type { SimpleStep } from '../types';

export interface GenericConfigResult {
  price: number;
  selections: CartSelection[];
  summary: string;
}

interface GenericConfiguratorProps {
  configurator: Configurator;
  basePrice: number;
  isStoreOpen: boolean;
  onAddToCart: (result: GenericConfigResult) => void;
}

const isStepValid = (step: ConfigStep, values: string[]): boolean => {
  const requiredMin = Math.max(step.min ?? 0, step.required ? 1 : 0);
  if (values.length < requiredMin) return false;
  if (step.max > 0 && values.length > step.max) return false;
  return true;
};

export const GenericConfigurator = ({ configurator, basePrice, isStoreOpen, onAddToCart }: GenericConfiguratorProps) => {
  const steps = configurator.steps ?? [];

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [selection, setSelection] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    steps.forEach((s) => {
      init[s.id] = s.options.filter((o) => o.defaultSelected).map((o) => o.id);
    });
    return init;
  });

  const step = steps[currentStep];
  const currentValues = step ? selection[step.id] ?? [] : [];

  const simpleSteps: SimpleStep[] = steps.map((s) => ({ stepId: s.id, label: s.label }));

  const allValid = steps.every((s) => isStepValid(s, selection[s.id] ?? []));

  const { price, selections, summary } = useMemo(() => {
    let base = basePrice;
    let extras = 0;
    const sels: CartSelection[] = [];
    const positives: string[] = [];
    const exclusions: string[] = [];

    steps.forEach((s) => {
      (selection[s.id] ?? []).forEach((optionId) => {
        const option = s.options.find((o) => o.id === optionId);
        if (!option) return;
        if (s.mode === 'absolute') base = option.price;
        else extras += option.price;

        sels.push({
          stepId: s.id,
          stepLabel: s.label,
          optionId: option.id,
          label: option.label,
          price: option.price,
          kind: option.kind,
        });

        if (option.kind === 'exclusion') exclusions.push(option.label);
        else positives.push(option.label);
      });
    });

    const finalPrice = Math.max(0, base + extras);
    let summary = positives.join(' · ');
    if (exclusions.length > 0) {
      const ex = exclusions.map((l) => l.replace(/^sin\s+/i, '')).join(', ');
      summary += `${summary ? ' | ' : ''}Sin: ${ex}`;
    }

    return { price: finalPrice, selections: sels, summary };
  }, [selection, basePrice, steps]);

  const selectSingle = (value: string) => {
    setSelection((prev) => ({ ...prev, [step.id]: [value] }));
  };

  const selectMultiple = (values: string[]) => {
    if (step.max > 0 && values.length > step.max) return;
    setSelection((prev) => ({ ...prev, [step.id]: values }));
  };

  const handleNext = () => {
    if (!step || !isStepValid(step, currentValues)) return;
    if (currentStep < steps.length - 1) {
      setCompletedSteps((prev) => (prev.includes(currentStep) ? prev : [...prev, currentStep]));
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCompletedSteps((prev) => prev.filter((s) => s !== currentStep - 1));
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleAdd = () => {
    if (!allValid || !isStoreOpen) return;
    onAddToCart({ price, selections, summary });
  };

  if (!step) return null;

  const isLastStep = currentStep === steps.length - 1;
  const stepValid = isStepValid(step, currentValues);
  const visibleOptions = step.options.filter((o) => o.active !== false);

  const radioOptions = visibleOptions.map((o) => ({
    id: o.id,
    label: o.label,
    description: o.description,
    price: o.price,
    isExtra: o.isExtra,
    priceLabel: step.mode === 'delta' && o.price > 0 ? `+$${o.price.toLocaleString()}` : undefined,
    type: 'radio' as const,
  }));

  const checkboxOptions = visibleOptions.map((o) => ({
    id: o.id,
    label: o.label,
    description: o.description,
    price: o.price,
    isExtra: o.isExtra,
    priceLabel: step.mode === 'delta' && o.price > 0 ? `+$${o.price.toLocaleString()}` : undefined,
    type: 'checkbox' as const,
  }));

  return (
    <div className="p-4 md:p-6">
      <ProgressStepper
        steps={simpleSteps}
        currentStep={currentStep}
        onStepClick={(i) => i <= currentStep && setCurrentStep(i)}
        completedSteps={completedSteps}
        className="mb-6 md:mb-8"
      />

      <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 md:p-6">
        <div className="mb-6">
          <h3 className="font-heading text-lg md:text-xl font-semibold text-white mb-2">
            Paso {currentStep + 1}: {step.title}
          </h3>
          {step.description && (
            <p className="text-white/50 text-sm md:text-base">{step.description}</p>
          )}
        </div>

        <div className="mb-8 min-h-[200px]">
          {step.type === 'single' ? (
            <RadioGroup
              options={radioOptions}
              selectedValue={currentValues[0] ?? null}
              onChange={selectSingle}
              columns={radioOptions.length <= 2 ? 2 : 3}
            />
          ) : (
            <CheckboxGroup
              options={checkboxOptions}
              selectedValues={currentValues}
              onChange={selectMultiple}
              minSelections={step.min}
              maxSelections={step.max > 0 ? step.max : undefined}
              columns={2}
            />
          )}
        </div>

        {!stepValid && (
          <div className="mb-6 flex items-center gap-2 text-sm text-amber-400/90">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {step.required || step.min > 0
                ? `Seleccioná ${step.min > 1 ? `al menos ${step.min} opciones` : 'una opción'} para continuar`
                : 'Revisá esta selección'}
            </span>
          </div>
        )}

        <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-xl">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-primary">Precio estimado</span>
            <span className="font-bold text-primary text-lg md:text-xl">${price.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-white/10">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed px-4 py-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver</span>
          </button>

          {isLastStep ? (
            <button
              onClick={handleAdd}
              disabled={!isStoreOpen || !allValid}
              className="flex items-center gap-2 bg-primary text-black font-bold px-6 py-3 rounded-xl hover:bg-primary/90 active:scale-95 transition-all disabled:bg-zinc-700 disabled:text-white/30 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Agregar al carrito</span>
              <span className="sm:hidden">Agregar</span>
              <span className="font-mono">– ${price.toLocaleString()}</span>
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!stepValid}
              className="flex items-center gap-2 bg-white/10 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <span className="sm:hidden">Sig.</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
