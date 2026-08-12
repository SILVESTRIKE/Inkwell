'use client';

import React from 'react';
import { ProjectData } from '@/lib/api-client';
import { ArrowLeft, ArrowRight, Check, Zap } from 'lucide-react';
import { ACT_DEFINITIONS } from './WorkflowSidebar';

interface BottomNavProps {
  project: ProjectData;
  selectedStep: number;
  onSelectStep: (stepNumber: number) => void;
  autoAdvance: boolean;
  onToggleAutoAdvance: () => void;
  onRunStep: (stepNum: number) => Promise<void>;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  project,
  selectedStep,
  onSelectStep,
  autoAdvance,
  onToggleAutoAdvance,
  onRunStep,
}) => {
  const stepStates = project.stepStates || [];
  const completedCount = stepStates.filter(s => s.status === 'done').length;

  const currentStepDone = stepStates.find(s => s.stepNumber === selectedStep)?.status === 'done';
  const hasNextStep = selectedStep < 5;
  const hasPrevStep = selectedStep > 1;

  const nextAct = hasNextStep ? ACT_DEFINITIONS.find(a => a.stepNumber === selectedStep + 1) : null;
  const prevAct = hasPrevStep ? ACT_DEFINITIONS.find(a => a.stepNumber === selectedStep - 1) : null;

  // Check if next step is unlocked
  const step1Done = stepStates.find(s => s.stepNumber === 1)?.status === 'done';
  const step2Done = stepStates.find(s => s.stepNumber === 2)?.status === 'done';
  const step3Done = stepStates.find(s => s.stepNumber === 3)?.status === 'done';
  const step4Done = stepStates.find(s => s.stepNumber === 4)?.status === 'done';

  const canGoNext = (): boolean => {
    if (!hasNextStep) return false;
    const nextStepNum = selectedStep + 1;
    if (nextStepNum === 2) return step1Done;
    if (nextStepNum === 3) return step2Done;
    if (nextStepNum === 4) return step1Done && step2Done;
    if (nextStepNum === 5) return step3Done && step4Done;
    return false;
  };

  const handleNextClick = () => {
    if (!canGoNext() || !hasNextStep) return;
    const nextStepNum = selectedStep + 1;
    onSelectStep(nextStepNum);

    // If Auto-Advance mode is enabled and next step is pending, auto-trigger execution
    if (autoAdvance) {
      const nextStatus = stepStates.find(s => s.stepNumber === nextStepNum)?.status;
      if (nextStatus !== 'done' && nextStatus !== 'running') {
        onRunStep(nextStepNum);
      }
    }
  };

  return (
    <footer className="h-14 bg-obsidian border-t border-rule px-4 sm:px-8 flex items-center justify-between font-ui shrink-0 select-none">
      {/* Left: Previous Step Button */}
      <button
        onClick={() => hasPrevStep && onSelectStep(selectedStep - 1)}
        disabled={!hasPrevStep}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition duration-fast ${
          hasPrevStep
            ? 'bg-charcoal hover:bg-sunken text-paper border border-rule cursor-pointer'
            : 'bg-transparent text-faint border border-transparent cursor-not-allowed opacity-40'
        }`}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{prevAct ? `Back: ${prevAct.name}` : 'Back'}</span>
      </button>

      {/* Center: 5-Dot Step Progress Indicator */}
      <div className="hidden sm:flex items-center space-x-3 text-xs">
        <span className="text-muted text-[11px] font-mono">{completedCount} / 5 Acts Done</span>
        <div className="flex items-center space-x-2">
          {ACT_DEFINITIONS.map(act => {
            const state = stepStates.find(s => s.stepNumber === act.stepNumber);
            const status = state?.status || 'pending';
            const isCurrent = selectedStep === act.stepNumber;

            return (
              <button
                key={act.stepNumber}
                onClick={() => onSelectStep(act.stepNumber)}
                title={`Act ${act.numStr}: ${act.name}`}
                className={`w-3 h-3 rounded-full transition-all duration-fast flex items-center justify-center ${
                  status === 'done'
                    ? 'bg-success text-obsidian'
                    : status === 'failed'
                    ? 'bg-error'
                    : isCurrent
                    ? 'bg-oxide ring-2 ring-oxide-soft'
                    : 'bg-sunken border border-rule'
                }`}
              >
                {status === 'done' && <Check className="w-2 h-2 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Auto-Advance Toggle & Next Step Button */}
      <div className="flex items-center space-x-3">
        {/* Auto-Advance Mode Switch */}
        <button
          onClick={onToggleAutoAdvance}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-sm text-[11px] font-semibold transition duration-fast border ${
            autoAdvance
              ? 'bg-oxide-soft text-oxide border-oxide/40'
              : 'bg-charcoal text-muted border-rule hover:text-paper'
          }`}
          title="When ON, clicking Next automatically triggers step execution"
        >
          <Zap className={`w-3 h-3 ${autoAdvance ? 'text-oxide fill-current' : 'text-faint'}`} />
          <span>Auto-Advance: {autoAdvance ? 'ON' : 'OFF'}</span>
        </button>

        {/* Next Step Button */}
        <button
          onClick={handleNextClick}
          disabled={!canGoNext()}
          className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition duration-fast shadow-card ${
            canGoNext()
              ? 'bg-oxide hover:bg-oxide-hover text-paper cursor-pointer'
              : 'bg-charcoal text-muted border border-rule cursor-not-allowed opacity-50'
          }`}
        >
          <span>{nextAct ? `Next: ${nextAct.name}` : 'Pipeline Complete'}</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    </footer>
  );
};
