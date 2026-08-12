'use client';

import React from 'react';
import { ProjectData } from '@/lib/api-client';
import { ArrowLeft, ArrowRight, Check, Zap, Lock } from 'lucide-react';
import { isStepUnlocked } from '@/lib/step-utils';
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

  const unlocked = (stepNum: number) => isStepUnlocked(stepNum, stepStates);

  const canGoNext = (): boolean => {
    if (!hasNextStep) return false;
    const nextStepNum = selectedStep + 1;
    return unlocked(nextStepNum);
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

      {/* Center: Connected Book Chapter Pipeline Stepper */}
      <div className="hidden md:flex items-center space-x-4 text-xs">
        <span className="text-muted text-[11px] font-mono shrink-0">{completedCount} / 5 Acts Done</span>

        {/* Connected Track & Stepper Nodes */}
        <div className="relative flex items-center justify-between w-64 sm:w-72 px-2 py-1">
          {/* Background Track Line */}
          <div className="absolute top-1/2 left-3 right-3 h-0.5 bg-rule -translate-y-1/2 rounded-full" />

          {/* Active Progress Fill Line */}
          <div
            className="absolute top-1/2 left-3 h-0.5 bg-oxide -translate-y-1/2 transition-all duration-500 rounded-full"
            style={{ width: `${((Math.max(1, selectedStep) - 1) / 4) * 100}%` }}
          />

          {ACT_DEFINITIONS.map(act => {
            const state = stepStates.find(s => s.stepNumber === act.stepNumber);
            const status = state?.status || 'pending';
            const isSelected = selectedStep === act.stepNumber;
            const isUnlocked = unlocked(act.stepNumber);

            return (
              <div key={act.stepNumber} className="relative z-10 bg-obsidian rounded-full">
                <button
                  disabled={!isUnlocked}
                  onClick={() => isUnlocked && onSelectStep(act.stepNumber)}
                  title={!isUnlocked ? `Act ${act.numStr}: ${act.name} (Locked - Requires prerequisites)` : `Act ${act.numStr}: ${act.name} (${status})`}
                  className={`w-7 h-7 rounded-full text-[10px] font-mono font-bold flex items-center justify-center transition-all duration-300 ${
                    !isUnlocked
                      ? 'bg-obsidian text-faint border-2 border-rule/50 cursor-not-allowed opacity-50'
                      : status === 'done'
                      ? 'bg-oxide text-paper border-2 border-oxide shadow-card hover:scale-110 cursor-pointer'
                      : status === 'failed'
                      ? 'bg-obsidian text-error border-2 border-error ring-2 ring-error/30 cursor-pointer'
                      : status === 'running'
                      ? 'bg-obsidian text-oxide border-2 border-oxide animate-pulse ring-2 ring-oxide/30 cursor-pointer'
                      : isSelected
                      ? 'bg-charcoal text-paper border-2 border-paper ring-2 ring-paper/20 scale-105 cursor-pointer'
                      : 'bg-obsidian text-muted border-2 border-rule hover:border-rule-strong cursor-pointer'
                  }`}
                >
                  {!isUnlocked ? (
                    <Lock className="w-3 h-3 text-faint stroke-[2]" />
                  ) : status === 'done' ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <span>{act.numStr}</span>
                  )}
                </button>
              </div>
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
