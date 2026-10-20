'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { SimpleStep } from '../types';

interface ProgressStepperProps {
  steps: SimpleStep[];
  currentStep: number;
  onStepClick: (index: number) => void;
  completedSteps: number[];
  className?: string;
}

export const ProgressStepper = ({
  steps,
  currentStep,
  onStepClick,
  completedSteps = [],
  className = ''
}: ProgressStepperProps) => {
  return (
    <div className={`flex items-center justify-center w-full gap-2 md:gap-4 ${className}`}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = completedSteps.includes(index);
        const isClickable = index <= currentStep || completedSteps.includes(index);

        return (
          <React.Fragment key={step.stepId}>
            <button
              onClick={() => isClickable && onStepClick(index)}
              disabled={!isClickable}
              className={`flex flex-col items-center gap-1.5 transition-all min-w-0 ${
                isCompleted
                  ? 'text-primary'
                  : isActive
                  ? 'text-white'
                  : 'text-white/40'
              }`}
              aria-current={isActive ? 'step' : undefined}
            >
              <div className="relative flex-shrink-0">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all border-2 ${
                  isCompleted
                    ? 'bg-primary border-primary text-black'
                    : isActive
                    ? 'bg-white border-white text-primary'
                    : 'bg-white/5 border-white/10 text-white/40'
                }`}>
                  {isCompleted ? (
                    <Check className="w-5 h-5 md:w-6 md:h-6" />
                  ) : (
                    <span className="font-bold text-sm md:text-base">{index + 1}</span>
                  )}
                </div>
              </div>
              <span className="hidden md:block text-xs font-medium whitespace-nowrap max-w-[100px] text-center">
                {step.label}
              </span>
            </button>

            {index < steps.length - 1 && (
              <div className="hidden md:flex flex-1 max-w-24 h-[2px] bg-white/10 relative overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.min(100, ((index + 1) / (steps.length - 1)) * 100)}%` }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};