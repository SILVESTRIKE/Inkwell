import React from 'react';
import { StepState } from '@/lib/api-client';
import { Check, AlertCircle } from 'lucide-react';

interface StepperProps {
  stepStates: StepState[];
  currentStepNumber: number;
  onSelectStep?: (stepNum: number) => void;
}

export const NARRATIVE_STEPS = [
  {
    stepNumber: 1,
    numStr: '01',
    name: 'STYLE',
    subtitle: 'Define visual language',
  },
  {
    stepNumber: 2,
    numStr: '02',
    name: 'CHARACTERS',
    subtitle: 'Discover the cast',
  },
  {
    stepNumber: 3,
    numStr: '03',
    name: 'PORTRAITS',
    subtitle: 'Give them a face',
  },
  {
    stepNumber: 4,
    numStr: '04',
    name: 'CHAPTERS',
    subtitle: 'Understand the world',
  },
  {
    stepNumber: 5,
    numStr: '05',
    name: 'ILLUSTRATIONS',
    subtitle: 'Bring story to life',
  },
];

export const Stepper: React.FC<StepperProps> = ({ stepStates = [], currentStepNumber, onSelectStep }) => {
  const safeStepStates = stepStates || [];

  return (
    <div className="w-full py-6 border-y border-rule my-6 font-ui">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-2">
        {NARRATIVE_STEPS.map((step) => {
          const state = safeStepStates.find(s => s.stepNumber === step.stepNumber);
          const status = state?.status || 'pending';
          const isCurrent = currentStepNumber === step.stepNumber;

          return (
            <button
              key={step.stepNumber}
              type="button"
              onClick={() => onSelectStep?.(step.stepNumber)}
              className={`flex flex-col text-left group focus:outline-none transition-all duration-fast relative pb-3 border-b-2 ${
                isCurrent
                  ? 'border-oxide'
                  : status === 'done'
                  ? 'border-rule-strong'
                  : 'border-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`font-display text-2xl font-bold transition-colors duration-fast ${
                    isCurrent || status === 'running'
                      ? 'text-oxide'
                      : status === 'failed'
                      ? 'text-error'
                      : status === 'done'
                      ? 'text-paper'
                      : 'text-muted'
                  }`}
                >
                  {step.numStr}
                </span>

                {status === 'done' && <Check className="w-3.5 h-3.5 text-success" />}
                {status === 'running' && (
                  <span className="w-2 h-2 rounded-xs bg-oxide animate-pulse" />
                )}
                {status === 'failed' && <AlertCircle className="w-3.5 h-3.5 text-error" />}
              </div>

              <span
                className={`text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors duration-fast ${
                  isCurrent
                    ? 'text-paper'
                    : status === 'done'
                    ? 'text-paper'
                    : 'text-muted group-hover:text-paper'
                }`}
              >
                {step.name}
              </span>

              <span className="text-xs font-body italic text-muted/90 mt-0.5 line-clamp-1">
                {step.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
