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
    <div className="w-full py-4 border-y border-rule my-6 font-ui">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {NARRATIVE_STEPS.map((step) => {
          const state = safeStepStates.find(s => s.stepNumber === step.stepNumber);
          const status = state?.status || 'pending';
          const isCurrent = currentStepNumber === step.stepNumber;

          return (
            <button
              key={step.stepNumber}
              type="button"
              onClick={() => onSelectStep?.(step.stepNumber)}
              title={status === 'failed' && state?.error ? `Error: ${state.error}` : undefined}
              className={`flex flex-col text-left group focus:outline-none transition-all duration-fast relative p-3 rounded-md border-2 ${
                status === 'failed'
                  ? 'bg-error/20 border-error text-error shadow-sm'
                  : isCurrent
                  ? 'bg-obsidian border-oxide shadow-sm'
                  : status === 'done'
                  ? 'bg-transparent border-transparent hover:bg-obsidian/60'
                  : 'bg-transparent border-transparent hover:bg-obsidian/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 w-full">
                <span
                  className={`font-display text-2xl font-bold transition-colors duration-fast ${
                    status === 'failed'
                      ? 'text-error'
                      : isCurrent || status === 'running'
                      ? 'text-oxide'
                      : status === 'done'
                      ? 'text-paper'
                      : 'text-muted'
                  }`}
                >
                  {step.numStr}
                </span>

                {status === 'done' && <Check className="w-4 h-4 text-success shrink-0" />}
                {status === 'running' && (
                  <span className="w-2.5 h-2.5 rounded-xs bg-oxide animate-pulse shrink-0" />
                )}
                {status === 'failed' && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-error text-paper rounded-xs shrink-0 flex items-center gap-1 shadow-sm">
                    <AlertCircle className="w-3 h-3" /> FAILED
                  </span>
                )}
              </div>

              <span
                className={`text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors duration-fast ${
                  status === 'failed'
                    ? 'text-error font-bold'
                    : isCurrent || status === 'done'
                    ? 'text-paper'
                    : 'text-muted group-hover:text-paper'
                }`}
              >
                {step.name}
              </span>

              <span
                className={`text-xs font-body italic mt-0.5 line-clamp-1 ${
                  status === 'failed'
                    ? 'text-error/90 font-semibold not-italic'
                    : 'text-muted/90'
                }`}
              >
                {status === 'failed' ? 'Not Done — Click to Retry' : step.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
