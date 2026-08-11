import React from 'react';
import { StepState } from '@/lib/api-client';
import { CheckCircle2, Loader2, AlertCircle, Circle } from 'lucide-react';

interface StepperProps {
  stepStates: StepState[];
  currentStepNumber: number;
  onSelectStep?: (stepNum: number) => void;
}

const STEP_LABELS = [
  '1. Style',
  '2. Characters',
  '3. Portraits',
  '4. Chapters',
  '5. Illustrations',
];

export const Stepper: React.FC<StepperProps> = ({ stepStates = [], currentStepNumber, onSelectStep }) => {
  const safeStepStates = stepStates || [];
  return (
    <div className="w-full py-4 border-b border-slate-800 bg-slate-900/50 px-6 rounded-xl mb-6">
      <div className="flex items-center justify-between">
        {STEP_LABELS.map((label, idx) => {
          const stepNum = idx + 1;
          const state = safeStepStates.find(s => s.stepNumber === stepNum);
          const status = state?.status || 'pending';
          const isCurrent = currentStepNumber === stepNum;

          return (
            <div key={stepNum} className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => onSelectStep?.(stepNum)}
                className="flex flex-col items-center group focus:outline-none cursor-pointer"
                title={`Select ${label}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all group-hover:scale-105 ${
                    status === 'done'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500'
                      : status === 'running'
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500 animate-pulse'
                      : status === 'failed'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500'
                      : isCurrent
                      ? 'bg-indigo-600 text-white border border-indigo-400'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {status === 'done' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  {status === 'running' && <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />}
                  {status === 'failed' && <AlertCircle className="w-5 h-5 text-rose-400" />}
                  {status === 'pending' && <span>{stepNum}</span>}
                </div>
                <span
                  className={`text-xs mt-2 font-medium transition-colors ${
                    isCurrent ? 'text-indigo-400 font-semibold' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {label}
                </span>
              </button>
              {stepNum < 5 && <div className="hidden sm:block w-12 h-0.5 bg-slate-800" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};
